/**
 * ニュースモジュール
 * Yahoo!ニュースRSSを使用
 */

const News = {
  // カテゴリー名のマッピング
  categoryNames: {
    'top-picks': 'トップ',
    'domestic': '国内',
    'world': '国際',
    'business': '経済',
    'entertainment': 'エンタメ',
    'sports': 'スポーツ',
    'it': 'IT',
    'science': '科学',
    'local': '地域'
  },

  // 複数のプロキシサービス（フォールバック用）
  proxyServices: [
    {
      name: 'rss2json',
      buildUrl: (rssUrl) => `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`,
      parseResponse: async (response) => {
        const data = await response.json();
        if (data.status !== 'ok') throw new Error('RSS feed error');
        return data.items;
      }
    },
    {
      name: 'allorigins',
      buildUrl: (rssUrl) => `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`,
      parseResponse: async (response) => {
        const text = await response.text();
        return News.parseRssXml(text);
      }
    },
    {
      name: 'corsproxy',
      buildUrl: (rssUrl) => `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`,
      parseResponse: async (response) => {
        const text = await response.text();
        return News.parseRssXml(text);
      }
    }
  ],

  /**
   * RSS XMLをパースしてアイテム配列に変換
   */
  parseRssXml(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const items = doc.querySelectorAll('item');
    
    return Array.from(items).map(item => ({
      title: item.querySelector('title')?.textContent || '',
      link: item.querySelector('link')?.textContent || '',
      pubDate: item.querySelector('pubDate')?.textContent || ''
    }));
  },

  /**
   * カテゴリー名を取得
   */
  getCategoryName(category) {
    return this.categoryNames[category] || 'トップ';
  },

  /**
   * ニュースを取得（複数プロキシでフォールバック）
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

    const rssUrl = `https://news.yahoo.co.jp/rss/topics/${category}.xml`;
    
    // 各プロキシサービスを順番に試す
    for (const proxy of this.proxyServices) {
      try {
        console.log(`ニュース取得を試行中: ${proxy.name}`);
        const apiUrl = proxy.buildUrl(rssUrl);
        
        const response = await fetch(apiUrl, {
          signal: AbortSignal.timeout(10000) // 10秒タイムアウト
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const items = await proxy.parseResponse(response);
        
        if (items && items.length > 0) {
          console.log(`ニュース取得成功: ${proxy.name}`);
          this.render(items);
          return; // 成功したら終了
        }
        
        throw new Error('No items found');
        
      } catch (error) {
        console.warn(`${proxy.name}での取得失敗:`, error.message);
        // 次のプロキシを試す
      }
    }
    
    // すべてのプロキシが失敗
    console.error('すべてのプロキシサービスでニュース取得に失敗');
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
    
    if (diffMins < 1) return '今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    
    return `${date.getMonth() + 1}/${date.getDate()}`;
  },

  /**
   * ニュースを表示
   */
  render(items) {
    const newsListEl = document.getElementById('newsList');
    if (!newsListEl) return;
    
    if (!items || items.length === 0) {
      newsListEl.innerHTML = '<div class="error">ニュースがありません</div>';
      return;
    }
    
    // 最新12件を表示
    const displayItems = items.slice(0, 12);
    
    let html = '';
    displayItems.forEach((item, index) => {
      const relativeTime = this.getRelativeTime(item.pubDate);
      
      html += `
        <div class="news-item">
          <span class="number">${index + 1}.</span>
          <span class="title">${this.escapeHtml(item.title)}</span>
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
