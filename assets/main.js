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

  const normalizeKey = (value) => safeText(value).trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  const FEATURED_REPOS = Object.freeze([
    'ragapp',
    'youtuberagqa',
    'genzsummarizer',
    'finalsecondproject',
    'datavisualizationsecondmidproject',
    'fbigun',
  ]);

  const LOCAL_PROJECT_OVERRIDES = Object.freeze({
    ragapp: {
      description:
        'RAG_APP (PDF Ingest + Qdrant + Gemini + Inngest + Streamlit). A small RAG (Retrieval-Augmented Generation) app.',
    },
  });

  const LOCAL_PROJECT_IMAGES = Object.freeze({
    'computervision': 'assets/images/Computer-Vision.png',
    'datavisualizationfirstproject': 'assets/images/Data-Visualization-First-Project.jpg',
    'datavisualizationsecondmidproject': 'assets/images/Data-Visualization-Second-MidProject.jpg',
    'drignazsemmelweis': 'assets/images/Dr.-Ignaz-Semmelweis.png',
    'fbigun': 'assets/images/FBI-Gun.jpg',
    'finaludacityproject': 'assets/images/Final-Udacity-Project.jpg',
    'finalsecondproject': 'assets/images/finalSecondProject.png',
    'findingdonors': 'assets/images/Finding-Donors.jpg',
    'flappybird': 'assets/images/Flappy-Bird.png',
    'genzsummarizer': 'assets/images/Genz_Summarizer.png',
    'homicide': 'assets/images/homicide.jpg',
    'sherlock': 'assets/images/sherlock.jpg',
    'sugarinyourblood': 'assets/images/SugarInYourBlood.jpg',
    'thirdprojectdv': 'assets/images/ThirdProjectDV.jpg',
    'timeloom': 'assets/images/time-loom.png',
    'ragapp': 'assets/images/RAG_APP.svg',
    'youtuberagqa': 'assets/images/Youtube_RAG_QA.png',
  });

  const getLocalProjectImageUrl = (repoName) => {
    const key = normalizeKey(repoName);
    const relativePath = LOCAL_PROJECT_IMAGES[key];
    if (!relativePath) return null;
    try {
      return new URL(relativePath, document.baseURI).toString();
    } catch {
      return relativePath;
    }
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
    const override = LOCAL_PROJECT_OVERRIDES[normalizeKey(title)] || null;
    const desc = safeText(override?.description || repo.description) || 'No description yet.';
    const language = safeText(repo.language);
    const stars = Number(repo.stargazers_count || 0);

    const article = document.createElement('article');
    article.className = 'card';
    article.dataset.kind = kind;

    const imgUrl = getLocalProjectImageUrl(title);
    if (imgUrl) {
      const media = document.createElement('div');
      media.className = 'card-media';

      const img = document.createElement('img');
      img.className = 'card-img';
      img.src = imgUrl;
      img.alt = `${title} project preview`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', () => {
        media.remove();
      });

      media.appendChild(img);
      article.appendChild(media);
    }

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
    requireImages,
  }) => {
    try {
      const repos = await fetchRepos(user);

      const filtered = repos
        .filter((r) => r && !r.archived)
        .filter((r) => !r.fork)
        .filter((r) => (mode === 'featured' ? safeText(r.name).toLowerCase() !== user.toLowerCase() : true))
        .filter((r) => safeText(r.name).toLowerCase() !== `${user}`.toLowerCase());

      const withImages = filtered.filter((r) => (requireImages ? Boolean(getLocalProjectImageUrl(r?.name)) : true));

      if (mode === 'featured') {
        const byKey = new Map(withImages.map((r) => [normalizeKey(r?.name), r]));
        const chosenFeatured = FEATURED_REPOS.map((key) => byKey.get(key)).filter(Boolean);

        grid.innerHTML = '';
        for (const repo of chosenFeatured) {
          grid.appendChild(createProjectCard(repo));
        }

        if (statusEl) {
          statusEl.textContent = chosenFeatured.length
            ? ''
            : 'No featured repos found. Check repo visibility and names.';
        }

        return;
      }

      const sorted = withImages
        .slice()
        .sort((a, b) => {
          const ap = Date.parse(a.pushed_at || '') || 0;
          const bp = Date.parse(b.pushed_at || '') || 0;
          if (bp !== ap) return bp - ap;
          const as = Number(a.stargazers_count || 0);
          const bs = Number(b.stargazers_count || 0);
          return bs - as;
        });

      const chosen = sorted;

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
      const requireImages = (grid.dataset.requireImages || '').toLowerCase() === 'true';
      renderGitHubList({ grid, statusEl, user, mode: 'all', requireImages }).then(() => applyFilter(selectedKind));
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
      const requireImages = (featuredGrid.dataset.requireImages || '').toLowerCase() === 'true';
      renderGitHubList({ grid: featuredGrid, statusEl: featuredStatus, user, mode: 'featured', requireImages });
    } else if (featuredStatus) {
      featuredStatus.textContent = 'Missing GitHub username (data-github-user).';
    }
  }
})();
