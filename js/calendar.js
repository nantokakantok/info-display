/**
 * カレンダーモジュール
 * 外部APIを使用せず、JavaScriptで現在日付とカレンダーを表示
 */

const Calendar = {
  // 曜日名（日本語）
  dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  
  // 曜日名（英語）
  dayNamesEn: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  
  // 曜日名（短縮）
  dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],

  /**
   * 今日の日付情報を更新
   */
  updateToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const dayIndex = now.getDay();
    
    // 年月表示
    const yearMonthEl = document.getElementById('yearMonth');
    if (yearMonthEl) {
      yearMonthEl.textContent = `${year}年${month}月`;
    }
    
    // 日付（大きな数字）
    const dateNumberEl = document.getElementById('dateNumber');
    if (dateNumberEl) {
      dateNumberEl.textContent = date;
      // 日曜・土曜で色を変える
      if (dayIndex === 0) {
        dateNumberEl.style.color = 'var(--sunday-color)';
      } else if (dayIndex === 6) {
        dateNumberEl.style.color = 'var(--saturday-color)';
      } else {
        dateNumberEl.style.color = 'var(--text-primary)';
      }
    }
    
    // 曜日（日本語）
    const dayNameEl = document.getElementById('dayName');
    if (dayNameEl) {
      dayNameEl.textContent = this.dayNames[dayIndex];
    }
    
    // 曜日（英語）
    const dayEnglishEl = document.getElementById('dayEnglish');
    if (dayEnglishEl) {
      dayEnglishEl.textContent = this.dayNamesEn[dayIndex];
    }
  },

  /**
   * ミニカレンダーを生成
   */
  generateMiniCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    
    // 月の最初の日と最後の日
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 前月の最後の日
    const prevLastDay = new Date(year, month, 0);
    
    // カレンダーの開始曜日（0=日曜日）
    const startDayOfWeek = firstDay.getDay();
    
    // テーブルを生成
    let html = '<table><thead><tr>';
    
    // 曜日ヘッダー
    this.dayNamesShort.forEach((day, index) => {
      let className = '';
      if (index === 0) className = 'sunday';
      if (index === 6) className = 'saturday';
      html += `<th class="${className}">${day}</th>`;
    });
    
    html += '</tr></thead><tbody><tr>';
    
    // 前月の日付を埋める
    for (let i = 0; i < startDayOfWeek; i++) {
      const day = prevLastDay.getDate() - startDayOfWeek + i + 1;
      let className = 'other-month';
      if (i === 0) className += ' sunday';
      if (i === 6) className += ' saturday';
      html += `<td class="${className}">${day}</td>`;
    }
    
    // 当月の日付
    let dayOfWeek = startDayOfWeek;
    for (let day = 1; day <= lastDay.getDate(); day++) {
      let className = '';
      if (dayOfWeek === 0) className = 'sunday';
      if (dayOfWeek === 6) className = 'saturday';
      if (day === today) className += ' today';
      
      html += `<td class="${className.trim()}">${day}</td>`;
      
      dayOfWeek++;
      if (dayOfWeek === 7 && day !== lastDay.getDate()) {
        html += '</tr><tr>';
        dayOfWeek = 0;
      }
    }
    
    // 翌月の日付を埋める
    let nextMonthDay = 1;
    while (dayOfWeek < 7 && dayOfWeek !== 0) {
      let className = 'other-month';
      if (dayOfWeek === 0) className += ' sunday';
      if (dayOfWeek === 6) className += ' saturday';
      html += `<td class="${className}">${nextMonthDay}</td>`;
      nextMonthDay++;
      dayOfWeek++;
    }
    
    html += '</tr></tbody></table>';
    
    const miniCalendarEl = document.getElementById('miniCalendar');
    if (miniCalendarEl) {
      miniCalendarEl.innerHTML = html;
    }
  },

  /**
   * カレンダー全体を初期化・更新
   */
  update() {
    this.updateToday();
    this.generateMiniCalendar();
  },

  /**
   * 初期化
   */
  init() {
    this.update();
    
    // 1分ごとに更新（日付変更を検出）
    setInterval(() => this.update(), 60000);
    
    // 深夜0時に確実に更新するための処理
    const now = new Date();
    const msUntilMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0, 0, 1
    ) - now;
    
    setTimeout(() => {
      this.update();
      // 以降は24時間ごとに更新
      setInterval(() => this.update(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }
};
