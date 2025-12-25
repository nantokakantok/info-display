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

  // カテゴリーごとのRSS URL（topicsとcategoriesの使い分け）
  rssUrls: {
    'top-picks': 'https://news.yahoo.co.jp/rss/topics/top-picks.xml',
    'domestic': 'https://news.yahoo.co.jp/rss/categories/domestic.xml',
    'world': 'https://news.yahoo.co.jp/rss/categories/world.xml',
    'business': 'https://news.yahoo.co.jp/rss/categories/business.xml',
    'entertainment': 'https://news.yahoo.co.jp/rss/categories/entertainment.xml',
    'sports': 'https://news.yahoo.co.jp/rss/categories/sports.xml',
    'it': 'https://news.yahoo.co.jp/rss/categories/it.xml',
    'science': 'https://news.yahoo.co.jp/rss/categories/science.xml',
    'local': 'https://news.yahoo.co.jp/rss/categories/local.xml'
  },

  // rss2json.com API
  rss2jsonApi: 'https://api.rss2json.com/v1/api.json',

  /**
   * カテゴリー名を取得
   */
  getCategoryName(category) {
    return this.categoryNames[category] || 'トップ';
  },

  /**
   * RSS URLを取得
   */
  getRssUrl(category) {
    return this.rssUrls[category] || this.rssUrls['top-picks'];
  },

  /**
   * ニュースを取得
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

    try {
      const rssUrl = this.getRssUrl(category);
      const apiUrl = `${this.rss2jsonApi}?rss_url=${encodeURIComponent(rssUrl)}`;
      
      console.log('ニュース取得中:', rssUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(`RSS feed error: ${data.message || 'Unknown error'}`);
      }
      
      console.log('ニュース取得成功:', data.items.length, '件');
      this.render(data.items);
      
    } catch (error) {
      console.error('ニュースの取得に失敗:', error);
      this.renderError();
    }
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
