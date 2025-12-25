/**
 * Info Display - メインアプリケーション
 * LG 29インチウルトラワイドディスプレイ（2560x1080）対応
 */

// =====================================
// 設定管理
// =====================================
const Settings = {
  defaults: {
    weatherRegion: '130000',  // 東京
    newsCategory: 'top-picks'
  },

  /**
   * 設定を取得
   */
  get(key) {
    const value = localStorage.getItem(key);
    return value !== null ? value : this.defaults[key];
  },

  /**
   * 設定を保存
   */
  set(key, value) {
    localStorage.setItem(key, value);
  },

  /**
   * 全設定を読み込み
   */
  load() {
    return {
      weatherRegion: this.get('weatherRegion'),
      newsCategory: this.get('newsCategory')
    };
  },

  /**
   * 設定を保存して適用
   */
  save(settings) {
    if (settings.weatherRegion) {
      this.set('weatherRegion', settings.weatherRegion);
    }
    if (settings.newsCategory) {
      this.set('newsCategory', settings.newsCategory);
    }
  }
};

// =====================================
// 時計
// =====================================
const Clock = {
  /**
   * 現在時刻を更新
   */
  update() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const timeEl = document.getElementById('currentTime');
    if (timeEl) {
      timeEl.textContent = `${hours}:${minutes}`;
    }
  },

  /**
   * 初期化
   */
  init() {
    this.update();
    // 1秒ごとに更新
    setInterval(() => this.update(), 1000);
  }
};

// =====================================
// 設定モーダル
// =====================================
const SettingsModal = {
  /**
   * モーダルを開く
   */
  open() {
    const settings = Settings.load();
    
    const regionSelect = document.getElementById('regionSelect');
    const categorySelect = document.getElementById('categorySelect');
    
    if (regionSelect) regionSelect.value = settings.weatherRegion;
    if (categorySelect) categorySelect.value = settings.newsCategory;
    
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('active');
  },

  /**
   * モーダルを閉じる
   */
  close() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('active');
  },

  /**
   * 設定を保存
   */
  save() {
    const regionSelect = document.getElementById('regionSelect');
    const categorySelect = document.getElementById('categorySelect');
    
    const newSettings = {
      weatherRegion: regionSelect ? regionSelect.value : Settings.defaults.weatherRegion,
      newsCategory: categorySelect ? categorySelect.value : Settings.defaults.newsCategory
    };
    
    Settings.save(newSettings);
    
    // 各モジュールを更新
    Weather.fetch();
    News.fetch();
    
    this.close();
  },

  /**
   * 初期化
   */
  init() {
    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });
    
    // モーダル外クリックで閉じる
    const modal = document.getElementById('settingsModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.close();
        }
      });
    }
  }
};

// =====================================
// グローバル関数（HTML onclick用）
// =====================================
function openSettings() {
  SettingsModal.open();
}

function closeSettings() {
  SettingsModal.close();
}

function saveSettings() {
  SettingsModal.save();
}

// =====================================
// アプリケーション初期化
// =====================================
const App = {
  /**
   * 初期化
   */
  init() {
    console.log('Info Display - 初期化開始');
    
    // 各モジュールを初期化
    Clock.init();
    Calendar.init();
    Weather.init();
    News.init();
    SettingsModal.init();
    
    console.log('Info Display - 初期化完了');
  }
};

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
