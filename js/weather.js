/**
 * 天気情報モジュール
 * 気象庁のJSONデータを使用（日本向け）
 */

const Weather = {
  // 地域コードと名前のマッピング
  regionNames: {
    '016000': '札幌', '017000': '函館',
    '020000': '青森', '030000': '岩手', '040000': '宮城', '050000': '秋田', 
    '060000': '山形', '070000': '福島',
    '080000': '茨城', '090000': '栃木', '100000': '群馬', '110000': '埼玉', 
    '120000': '千葉', '130000': '東京', '140000': '神奈川',
    '150000': '新潟', '160000': '富山', '170000': '石川', '180000': '福井', 
    '190000': '山梨', '200000': '長野', '210000': '岐阜', '220000': '静岡', 
    '230000': '愛知',
    '240000': '三重', '250000': '滋賀', '260000': '京都', '270000': '大阪', 
    '280000': '兵庫', '290000': '奈良', '300000': '和歌山',
    '310000': '鳥取', '320000': '島根', '330000': '岡山', '340000': '広島', 
    '350000': '山口',
    '360000': '徳島', '370000': '香川', '380000': '愛媛', '390000': '高知',
    '400000': '福岡', '410000': '佐賀', '420000': '長崎', '430000': '熊本', 
    '440000': '大分', '450000': '宮崎', '460100': '鹿児島', '471000': '沖縄'
  },

  // 天気コードからアイコンへのマッピング
  weatherIcons: {
    '100': '☀️', '101': '🌤️', '102': '⛅', '103': '🌥️', '104': '☁️',
    '110': '🌤️', '111': '🌤️', '112': '🌤️', '113': '🌤️', '114': '🌤️',
    '115': '🌤️', '116': '🌤️', '117': '🌤️', '118': '🌤️', '119': '🌤️',
    '120': '🌤️', '121': '🌤️', '122': '⛅', '123': '🌥️', '124': '🌥️',
    '125': '🌥️', '126': '🌥️', '127': '🌥️', '128': '☁️',
    '130': '🌧️', '131': '🌧️', '132': '🌧️', '140': '🌧️',
    '200': '☁️', '201': '☁️', '202': '☁️', '203': '☁️', '204': '☁️',
    '206': '☁️', '207': '☁️', '208': '☁️', '209': '☁️', '210': '☁️',
    '211': '☁️', '212': '☁️', '213': '☁️', '214': '☁️', '215': '☁️',
    '216': '☁️', '217': '☁️', '218': '☁️', '219': '☁️', '220': '☁️',
    '221': '☁️', '222': '☁️', '223': '☁️', '224': '☁️', '225': '☁️',
    '226': '☁️', '228': '☁️', '229': '☁️', '230': '☁️', '231': '☁️',
    '240': '🌧️', '250': '🌧️', '260': '🌧️', '270': '❄️', '281': '❄️',
    '300': '🌧️', '301': '🌧️', '302': '🌧️', '303': '🌧️', '304': '🌧️',
    '306': '⛈️', '308': '⛈️', '309': '🌧️', '311': '🌧️', '313': '🌧️',
    '314': '🌧️', '315': '🌧️', '316': '🌧️', '317': '🌧️', '320': '🌧️',
    '321': '🌧️', '322': '🌧️', '323': '🌧️', '324': '🌧️', '325': '🌧️',
    '326': '🌧️', '327': '🌧️', '328': '🌧️', '329': '🌧️',
    '340': '❄️', '350': '❄️', '361': '❄️', '371': '❄️',
    '400': '❄️', '401': '❄️', '402': '❄️', '403': '❄️', '405': '❄️',
    '406': '❄️', '407': '❄️', '409': '❄️', '411': '❄️', '413': '❄️',
    '414': '❄️', '420': '❄️', '421': '❄️', '422': '❄️', '423': '❄️',
    '425': '❄️', '426': '❄️', '427': '❄️', '430': '❄️', '450': '❄️'
  },

  /**
   * 天気コードからアイコンを取得
   */
  getIcon(code) {
    return this.weatherIcons[code] || '🌈';
  },

  /**
   * 地域名を取得
   */
  getRegionName(code) {
    return this.regionNames[code] || '不明';
  },

  /**
   * 天気情報を取得
   */
  async fetch() {
    const region = Settings.get('weatherRegion');
    const regionName = this.getRegionName(region);
    
    // 地域名を更新
    const regionNameEl = document.getElementById('regionName');
    if (regionNameEl) {
      regionNameEl.textContent = regionName;
    }

    try {
      const response = await fetch(
        `https://www.jma.go.jp/bosai/forecast/data/forecast/${region}.json`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.render(data);
      this.renderForecast(data);
      
    } catch (error) {
      console.error('天気情報の取得に失敗:', error);
      this.renderError();
    }
  },

  /**
   * 今日の天気を表示
   */
  render(data) {
    try {
      // 今日の天気
      const today = data[0].timeSeries[0];
      const weatherCode = today.areas[0].weatherCodes[0];
      const weather = today.areas[0].weathers[0];
      
      // 気温データ
      let temp = '--';
      let tempMax = '--';
      let tempMin = '--';
      
      if (data[0].timeSeries.length >= 3) {
        const tempData = data[0].timeSeries[2].areas[0];
        if (tempData.temps) {
          temp = tempData.temps[0] || tempData.temps[1] || '--';
        }
      }
      
      // 週間予報から最高・最低気温を取得
      if (data[1] && data[1].timeSeries && data[1].timeSeries[1]) {
        const weekTempData = data[1].timeSeries[1].areas[0];
        if (weekTempData.tempsMax) tempMax = weekTempData.tempsMax[0] || '--';
        if (weekTempData.tempsMin) tempMin = weekTempData.tempsMin[0] || '--';
      }
      
      // 風
      const wind = today.areas[0].winds ? today.areas[0].winds[0] : '';
      
      // 波
      const wave = today.areas[0].waves ? today.areas[0].waves[0] : '';
      
      // 降水確率
      let pops = [];
      if (data[0].timeSeries[1]) {
        const popData = data[0].timeSeries[1].areas[0];
        if (popData.pops) {
          pops = popData.pops;
        }
      }
      
      // DOM更新
      const iconEl = document.getElementById('weatherIcon');
      if (iconEl) iconEl.textContent = this.getIcon(weatherCode);
      
      const tempEl = document.getElementById('temp');
      if (tempEl) tempEl.textContent = `${temp}°C`;
      
      const descEl = document.getElementById('weatherDesc');
      if (descEl) descEl.textContent = weather.split('　')[0];
      
      // 詳細情報
      const detailsEl = document.getElementById('weatherDetails');
      if (detailsEl) {
        let detailsHtml = '';
        
        if (tempMax !== '--' || tempMin !== '--') {
          detailsHtml += `
            <div class="weather-detail-item">
              <span class="icon">🌡️</span>
              <span>最高 ${tempMax}°C / 最低 ${tempMin}°C</span>
            </div>
          `;
        }
        
        if (pops.length > 0) {
          const popText = pops.map((p, i) => {
            const hours = ['0-6', '6-12', '12-18', '18-24'];
            return `${hours[i] || ''}時: ${p}%`;
          }).join(' ');
          detailsHtml += `
            <div class="weather-detail-item">
              <span class="icon">☔</span>
              <span>降水確率 ${pops[0] || '--'}%</span>
            </div>
          `;
        }
        
        if (wind) {
          detailsHtml += `
            <div class="weather-detail-item">
              <span class="icon">💨</span>
              <span>${wind}</span>
            </div>
          `;
        }
        
        if (wave) {
          detailsHtml += `
            <div class="weather-detail-item">
              <span class="icon">🌊</span>
              <span>${wave}</span>
            </div>
          `;
        }
        
        detailsEl.innerHTML = detailsHtml || '<div class="weather-detail-item">詳細情報なし</div>';
      }
      
    } catch (error) {
      console.error('天気データの解析に失敗:', error);
      this.renderError();
    }
  },

  /**
   * 週間予報を表示
   */
  renderForecast(data) {
    const forecastEl = document.getElementById('forecastList');
    if (!forecastEl) return;
    
    try {
      if (!data[1] || !data[1].timeSeries) {
        forecastEl.innerHTML = '<div class="loading">週間予報データなし</div>';
        return;
      }
      
      const weekData = data[1].timeSeries[0];
      const weekTempData = data[1].timeSeries[1];
      
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      let html = '';
      
      // 最大6日分表示
      const maxDays = Math.min(6, weekData.timeDefines.length);
      
      for (let i = 0; i < maxDays; i++) {
        const date = new Date(weekData.timeDefines[i]);
        const dayOfWeek = dayNames[date.getDay()];
        const dayNum = date.getDate();
        
        const weatherCode = weekData.areas[0].weatherCodes[i];
        const icon = this.getIcon(weatherCode);
        
        let tempHigh = '--';
        let tempLow = '--';
        
        if (weekTempData && weekTempData.areas[0]) {
          if (weekTempData.areas[0].tempsMax) {
            tempHigh = weekTempData.areas[0].tempsMax[i] || '--';
          }
          if (weekTempData.areas[0].tempsMin) {
            tempLow = weekTempData.areas[0].tempsMin[i] || '--';
          }
        }
        
        let dayClass = '';
        if (date.getDay() === 0) dayClass = 'sunday';
        if (date.getDay() === 6) dayClass = 'saturday';
        
        html += `
          <div class="forecast-item">
            <div class="day ${dayClass}">${dayNum}日(${dayOfWeek})</div>
            <div class="icon">${icon}</div>
            <div class="temps">
              <span class="temp-high">${tempHigh}°</span>
              <span class="temp-low">${tempLow}°</span>
            </div>
          </div>
        `;
      }
      
      forecastEl.innerHTML = html;
      
    } catch (error) {
      console.error('週間予報の解析に失敗:', error);
      forecastEl.innerHTML = '<div class="error">週間予報を取得できませんでした</div>';
    }
  },

  /**
   * エラー表示
   */
  renderError() {
    const detailsEl = document.getElementById('weatherDetails');
    if (detailsEl) {
      detailsEl.innerHTML = '<div class="error">天気情報を取得できませんでした</div>';
    }
    
    const forecastEl = document.getElementById('forecastList');
    if (forecastEl) {
      forecastEl.innerHTML = '<div class="error">週間予報を取得できませんでした</div>';
    }
  },

  /**
   * 初期化
   */
  init() {
    this.fetch();
    
    // 10分ごとに更新
    setInterval(() => this.fetch(), 10 * 60 * 1000);
  }
};
