(() => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const path = (window.location.pathname || '').toLowerCase();
  const current =
    path.endsWith('/projects.html') || path.endsWith('projects.html')
      ? 'projects'
      : path.endsWith('/about.html') || path.endsWith('about.html')
        ? 'about'
        : path.endsWith('/resume.html') || path.endsWith('resume.html')
          ? 'resume'
        : 'home';

  for (const link of document.querySelectorAll('[data-nav]')) {
    if (link.getAttribute('data-nav') === current) {
      link.setAttribute('aria-current', 'page');
    }
  }

  const getGitHubUser = () => {
    const fromHtml = document.documentElement?.getAttribute('data-github-user');
    return fromHtml && fromHtml.trim() ? fromHtml.trim() : null;
  };

  const formatKindLabel = (kind) => {
    switch (kind) {
      case 'data':
        return 'Data';
      case 'ml':
        return 'ML';
      case 'web':
        return 'Web';
      case 'ai':
        return 'AI';
      default:
        return 'Other';
    }
  };

  const safeText = (value) => {
    if (value == null) return '';
    return String(value);
  };

  const guessKind = (repo) => {
    const name = safeText(repo.name).toLowerCase();
    const desc = safeText(repo.description).toLowerCase();
    const homepage = safeText(repo.homepage).toLowerCase();
    const language = safeText(repo.language).toLowerCase();
    const topics = Array.isArray(repo.topics) ? repo.topics.map((t) => String(t).toLowerCase()) : [];

    const haystack = [name, desc, homepage, language, ...topics].join(' ');

    const has = (re) => re.test(haystack);

    if (has(/\b(ai|llm|rag|gpt|openai|summari[sz]er|nlp|transformer)\b/)) return 'ai';
    if (has(/\b(computer[- ]vision|opencv|yolo|cnn|deep[- ]learning|tensorflow|pytorch)\b/)) return 'ml';
    if (has(/\b(machine[- ]learning|ml|classification|regression|clustering|model)\b/)) return 'ml';
    if (has(/\b(eda|data[- ]analysis|analytics|dashboard|visuali[sz]ation|power\s?bi|sql)\b/)) return 'data';
    if (has(/\b(django|fastapi|flask|api|frontend|react|next\.?js|vercel|html|css|javascript|typescript)\b/)) return 'web';

    if (language === 'typescript' || language === 'javascript' || language === 'html' || language === 'css') return 'web';
    if (language === 'python') return 'data';
    if (language === 'jupyter notebook') return 'data';

    return 'web';
  };

  const createProjectCard = (repo) => {
    const kind = guessKind(repo);
    const title = safeText(repo.name);
    const desc = safeText(repo.description) || 'No description yet.';
    const language = safeText(repo.language);
    const stars = Number(repo.stargazers_count || 0);

    const article = document.createElement('article');
    article.className = 'card';
    article.dataset.kind = kind;

    const head = document.createElement('div');
    head.className = 'card-head';

    const h = document.createElement('h2');
    h.className = 'card-title';
    h.textContent = title;

    const p = document.createElement('p');
    p.className = 'card-dek';
    p.textContent = desc;

    head.appendChild(h);
    head.appendChild(p);

    const tags = document.createElement('ul');
    tags.className = 'tag-row';
    tags.setAttribute('aria-label', 'Tags');

    const mkTag = (text) => {
      const li = document.createElement('li');
      li.className = 'tag';
      li.textContent = text;
      return li;
    };

    tags.appendChild(mkTag(formatKindLabel(kind)));
    if (language) tags.appendChild(mkTag(language));
    if (repo.fork) tags.appendChild(mkTag('Fork'));
    if (stars > 0) tags.appendChild(mkTag(`★ ${stars}`));

    const links = document.createElement('div');
    links.className = 'card-links';

    const mkLink = (href, text) => {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = text;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      return a;
    };

    if (repo.homepage) {
      links.appendChild(mkLink(repo.homepage, 'Live'));
    }

    links.appendChild(mkLink(repo.html_url, 'Code'));

    article.appendChild(head);
    article.appendChild(tags);
    article.appendChild(links);

    return article;
  };

  const fetchRepos = async (user) => {
    const url = `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });

    if (!res.ok) {
      const rate = res.headers.get('x-ratelimit-remaining');
      const hint = rate === '0' ? ' (rate limit hit — try again later)' : '';
      throw new Error(`GitHub API request failed: ${res.status}${hint}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data;
  };

  const renderGitHubList = async ({
    grid,
    statusEl,
    user,
    mode,
  }) => {
    try {
      const repos = await fetchRepos(user);

      const filtered = repos
        .filter((r) => r && !r.archived)
        .filter((r) => (mode === 'featured' ? !r.fork : true))
        .filter((r) => (mode === 'featured' ? safeText(r.name).toLowerCase() !== user.toLowerCase() : true))
        .filter((r) => safeText(r.name).toLowerCase() !== `${user}`.toLowerCase());

      const sorted = filtered
        .slice()
        .sort((a, b) => {
          const ap = Date.parse(a.pushed_at || '') || 0;
          const bp = Date.parse(b.pushed_at || '') || 0;
          if (bp !== ap) return bp - ap;
          const as = Number(a.stargazers_count || 0);
          const bs = Number(b.stargazers_count || 0);
          return bs - as;
        });

      const chosen = mode === 'featured' ? sorted.slice(0, 6) : sorted;

      grid.innerHTML = '';
      for (const repo of chosen) {
        grid.appendChild(createProjectCard(repo));
      }

      if (statusEl) {
        statusEl.textContent = chosen.length ? '' : 'No public repos found.';
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = `Couldn’t load GitHub projects. ${err?.message || ''}`.trim();
      }
    }
  };

  // Projects page: filter chips + GitHub grid
  const grid = document.getElementById('projectGrid');
  const statusEl = document.getElementById('projectsStatus');
  const chips = Array.from(document.querySelectorAll('[data-filter]'));

  if (grid && chips.length) {
    let selectedKind = 'all';

    const setPressed = (pressed) => {
      for (const chip of chips) {
        chip.setAttribute('aria-pressed', chip.dataset.filter === pressed ? 'true' : 'false');
      }
    };

    const applyFilter = (kind) => {
      selectedKind = kind;
      const cards = Array.from(grid.querySelectorAll('[data-kind]'));
      for (const card of cards) {
        const show = kind === 'all' ? true : card.dataset.kind === kind;
        card.style.display = show ? '' : 'none';
      }
      setPressed(kind);
    };

    for (const chip of chips) {
      chip.addEventListener('click', () => applyFilter(chip.dataset.filter || 'all'));
    }

    applyFilter('all');

    const user = getGitHubUser();
    if (user) {
      renderGitHubList({ grid, statusEl, user, mode: 'all' }).then(() => applyFilter(selectedKind));
    } else if (statusEl) {
      statusEl.textContent = 'Missing GitHub username (data-github-user).';
    }
  }

  // Home page: featured repos
  const featuredGrid = document.getElementById('featuredGrid');
  const featuredStatus = document.getElementById('featuredStatus');
  if (featuredGrid) {
    const user = getGitHubUser();
    if (user) {
      renderGitHubList({ grid: featuredGrid, statusEl: featuredStatus, user, mode: 'featured' });
    } else if (featuredStatus) {
      featuredStatus.textContent = 'Missing GitHub username (data-github-user).';
    }
  }
})();
