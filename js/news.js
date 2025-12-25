/**
 * ニュースモジュール
 * NHKニュースRSSを使用（XMLを直接パース）
 */

const News = {
  // カテゴリー名のマッピング
  categoryNames: {
    'main': '主要',
    'society': '社会',
    'science': '科学・文化',
    'politics': '政治',
    'business': '経済',
    'world': '国際',
    'sports': 'スポーツ',
    'lifestyle': '生活'
  },

  // NHKニュースRSS URL（カテゴリ別）
  rssUrls: {
    'main': 'https://www.nhk.or.jp/rss/news/cat0.xml',      // 主要ニュース
    'society': 'https://news.web.nhk/n-data/conf/na/rss/cat1.xml',   // 社会
    'science': 'https://www.nhk.or.jp/rss/news/cat3.xml',   // 科学・文化
    'politics': 'https://www.nhk.or.jp/rss/news/cat4.xml',  // 政治
    'business': 'https://www.nhk.or.jp/rss/news/cat5.xml',  // 経済
    'world': 'https://www.nhk.or.jp/rss/news/cat6.xml',     // 国際
    'sports': 'https://www.nhk.or.jp/rss/news/cat7.xml',    // スポーツ
    'lifestyle': 'https://www.nhk.or.jp/rss/news/cat2.xml'  // 生活
  },

  // CORSプロキシ（キャッシュなし）- 安定順
  corsProxies: [
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ],

  /**
   * カテゴリー名を取得
   */
  getCategoryName(category) {
    return this.categoryNames[category] || '主要';
  },

  /**
   * RSS URLを取得
   */
  getRssUrl(category) {
    return this.rssUrls[category] || this.rssUrls['main'];
  },

  /**
   * RSS XMLをパースしてアイテム配列に変換
   */
  parseRssXml(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    
    // パースエラーチェック
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML parse error');
    }
    
    const items = doc.querySelectorAll('item');
    
    return Array.from(items).map(item => ({
      title: item.querySelector('title')?.textContent || '',
      link: item.querySelector('link')?.textContent || '',
      pubDate: item.querySelector('pubDate')?.textContent || '',
      description: item.querySelector('description')?.textContent || ''
    }));
  },

  /**
   * ニュースを取得（XMLを直接パース）
   */
  async fetch() {
    const category = Settings.get('newsCategory');
    const categoryName = this.getCategoryName(category);
    
    // カテゴリー名を更新
    const categoryNameEl = document.getElementById('categoryName');
    if (categoryNameEl) {
      categoryNameEl.textContent = categoryName;
    }

    // ローディング表示
    const newsListEl = document.getElementById('newsList');
    if (newsListEl) {
      newsListEl.innerHTML = '<div class="loading">ニュースを読み込み中...</div>';
    }

    const rssUrl = this.getRssUrl(category);
    
    // 各プロキシを順番に試す
    for (let i = 0; i < this.corsProxies.length; i++) {
      try {
        const proxyUrl = this.corsProxies[i](rssUrl);
        console.log(`ニュース取得中 (プロキシ${i + 1}):`, rssUrl);
        
        const response = await fetch(proxyUrl, {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const xmlText = await response.text();
        const items = this.parseRssXml(xmlText);
        
        if (items.length > 0) {
          console.log('ニュース取得成功:', items.length, '件');
          console.log('最新記事:', items[0]?.title, '- 公開日:', items[0]?.pubDate);
          this.render(items);
          return; // 成功したら終了
        }
        
        throw new Error('No items found');
        
      } catch (error) {
        console.warn(`プロキシ${i + 1}での取得失敗:`, error.message);
        // 次のプロキシを試す
      }
    }
    
    // すべてのプロキシが失敗
    console.error('すべてのプロキシでニュース取得に失敗');
    this.renderError();
  },

  /**
   * 相対時間を計算
   */
  getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 0) return '新着';
    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays === 1) return '昨日';
    if (diffDays < 7) return `${diffDays}日前`;
    
    // 1週間以上前は日付表示
    return `${date.getMonth() + 1}/${date.getDate()}`;
  },

  /**
   * ニュースを表示（新しい順にソート）
   */
  render(items) {
    const newsListEl = document.getElementById('newsList');
    if (!newsListEl) return;
    
    if (!items || items.length === 0) {
      newsListEl.innerHTML = '<div class="error">ニュースがありません</div>';
      return;
    }
    
    // 日付順にソート（新しい順）
    const sortedItems = [...items].sort((a, b) => {
      return new Date(b.pubDate) - new Date(a.pubDate);
    });
    
    // 最新10件を表示
    const displayItems = sortedItems.slice(0, 10);
    
    let html = '';
    displayItems.forEach((item, index) => {
      const relativeTime = this.getRelativeTime(item.pubDate);
      const isOld = relativeTime.includes('日前') || relativeTime.includes('昨日') || relativeTime.includes('/');
      
      html += `
        <div class="news-item ${isOld ? 'old-news' : ''}">
          <span class="number">${index + 1}.</span>
          <a href="${this.escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" class="title">${this.escapeHtml(item.title)}</a>
          <span class="time">${relativeTime}</span>
        </div>
      `;
    });
    
    newsListEl.innerHTML = html;
  },

  /**
   * HTMLエスケープ
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * エラー表示
   */
  renderError() {
    const newsListEl = document.getElementById('newsList');
    if (newsListEl) {
      newsListEl.innerHTML = `
        <div class="error">
          ニュースを取得できませんでした<br>
          <small style="opacity: 0.7;">しばらくしてから再度お試しください</small>
        </div>
      `;
    }
  },

  /**
   * 初期化
   */
  init() {
    this.fetch();
    
    // 5分ごとに更新
    setInterval(() => this.fetch(), 5 * 60 * 1000);
  }
};
