(function () {
  'use strict';

  const CONFIG = (typeof window.OPENCALL_CONFIG === 'object' && window.OPENCALL_CONFIG) || {};
  const GAS_URL = typeof CONFIG.gasUrl === 'string' && CONFIG.gasUrl.indexOf('PASTE_') !== 0 ? CONFIG.gasUrl : null;

  const q = new URLSearchParams(window.location.search);
  const APP_ID = (q.get('id') || '').trim();
  const TOKEN = (q.get('token') || '').trim();

  let lang = q.get('lang') === 'en' ? 'en' : 'ja';
  let state = { applicant: null, currentBooking: null, lock: {}, slots: [], selectedDate: null, selectedTime: null };

  const I18N = {
    ja: {
      title: 'Zoom面接日時予約（20分間）',
      lead: 'ご希望の日時を1つ選択してください。表示時刻はすべて日本標準時（JST）です。',
      jstNote: '※ 表示時刻はすべて JST（日本標準時）です（現地時間への自動変換は行いません）',
      loading: '予約情報を読み込んでいます…',
      errTitle: '予約ページを開けませんでした',
      errMissing: 'URLに受付番号または認証トークンが含まれていません。案内メールのリンクから再度アクセスしてください。',
      errNotFound: '該当する応募情報が見つかりませんでした。air@koganecho.net までお問い合わせください。',
      errTaken: '選択された日時は先ほど他の方により予約されました。別の日時をお選びください。',
      errDeadline: '予約・変更の最終締切を過ぎたため、オンラインでの操作はできません。air@koganecho.net までお問い合わせください。',
      errTooClose: '面接開始時刻の24時間前を過ぎているため、オンラインでの変更はできません。緊急の変更は air@koganecho.net までご連絡ください。',
      errSlotTooClose: '開始24時間以内の時間帯は選択できません。別の日時をお選びください。',
      errNet: '通信エラーが発生しました。しばらくしてから再度お試しください。',
      lblId: '受付番号',
      lblName: 'お名前',
      lblProgram: 'プログラム区分',
      lblLang: '面接言語',
      progShort: '短期（3か月）',
      progLong: '長期（1年）',
      currentLbl: '現在のご予約日時（確定済み）',
      currentNote: '変更が必要な場合は下のボタンから別の日時を選択してください。',
      currentNoteLocked: '変更受付期限を過ぎたため、オンラインでの変更はできません。緊急の変更は air@koganecho.net までご連絡ください。',
      reschedule: '予約日時を変更する',
      pickDate: '1. 日付を選択（JST）',
      pickTime: '2. 時間を選択（20分間・JST）',
      submit: 'この日時で予約を確定する',
      submitting: '予約を確定しています…',
      bookedTag: '予約済み',
      closedTag: '受付終了',
      noSlots: '現在予約可能な日程がありません。air@koganecho.net までお問い合わせください。',
      doneTitle: '✓ Zoom面接の日時が確定しました',
      doneDesc: '確認メールをお送りしましたのでご確認ください。Zoomの参加URLは面接日の前日までに別途メールでお送りいたします。',
      doneDescWithZoom: '確認メールをお送りしましたのでご確認ください。面接当日は開始5分前までに上記Zoom URLよりご入室ください。',
      zoomLabel: 'Zoom参加URL: ',
      reloadBtn: '予約状況を確認・変更する',
      weekdays: ['日', '月', '火', '水', '木', '金', '土'],
    },
    en: {
      title: 'Zoom Interview Scheduler (20 min)',
      lead: 'Please select one preferred date and time slot below. All times are in Japan Standard Time (JST).',
      jstNote: '* All times are shown strictly in JST (Japan Standard Time).',
      loading: 'Loading available interview slots…',
      errTitle: 'Unable to open scheduler',
      errMissing: 'Missing application ID or token in URL. Please use the personal link in your email.',
      errNotFound: 'Application not found or invalid link. Please contact air@koganecho.net.',
      errTaken: 'That time slot was just booked by another applicant. Please select a different slot.',
      errDeadline: 'The booking/reschedule deadline has passed. Please contact air@koganecho.net.',
      errTooClose: 'Online rescheduling is closed within 24 hours of your scheduled interview. For urgent changes, contact air@koganecho.net.',
      errSlotTooClose: 'Slots within 24 hours cannot be selected. Please choose a later slot.',
      errNet: 'Network error. Please try again shortly.',
      lblId: 'Application ID',
      lblName: 'Applicant',
      lblProgram: 'Program',
      lblLang: 'Interview Language',
      progShort: 'Short-term (3 months)',
      progLong: 'Long-term (1 year)',
      currentLbl: 'Current Confirmed Interview',
      currentNote: 'If you need to reschedule, click below to choose another slot.',
      currentNoteLocked: 'The reschedule deadline has passed, so online changes are closed. For urgent inquiries, please contact air@koganecho.net.',
      reschedule: 'Change / Reschedule Time',
      pickDate: '1. Select Date (JST)',
      pickTime: '2. Select Time Slot (20 min · JST)',
      submit: 'Confirm Interview Time',
      submitting: 'Confirming your booking…',
      bookedTag: 'Booked',
      closedTag: 'Closed',
      noSlots: 'No interview slots are currently open. Please contact air@koganecho.net.',
      doneTitle: '✓ Interview Time Confirmed',
      doneDesc: 'A confirmation email has been sent to you. We will email the Zoom link no later than one day before your interview.',
      doneDescWithZoom: 'A confirmation email has been sent to you. Please join via the Zoom URL above at least 5 minutes before your scheduled time.',
      zoomLabel: 'Zoom URL: ',
      reloadBtn: 'View / Change Booking',
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    },
  };

  const $ = (s) => document.querySelector(s);

  function fmtDateLabel(isoDate) {
    const t = I18N[lang];
    const d = new Date(isoDate + 'T00:00:00+09:00');
    const wd = isNaN(d.getTime()) ? '' : t.weekdays[d.getUTCDay()];
    return lang === 'ja' ? `${isoDate} (${wd})` : `${isoDate} (${wd})`;
  }

  function applyStaticText() {
    const t = I18N[lang];
    document.documentElement.lang = lang;
    $('#ivTitle').textContent = t.title;
    $('#ivLead').textContent = t.lead;
    $('#ivJstNote').textContent = t.jstNote;
    $('#ivLoadingText').textContent = t.loading;
    $('#ivPickDateHeading').textContent = t.pickDate;
    $('#ivPickTimeHeading').textContent = t.pickTime;
    $('#ivSubmitBtn').textContent = t.submit;
    $('#ivRescheduleBtn').textContent = t.reschedule;
    $('#ivDoneTitle').textContent = t.doneTitle;
    $('#ivDoneDesc').textContent = t.doneDesc;
    $('#ivReloadBtn').textContent = t.reloadBtn;
    document.querySelectorAll('[data-set-lang]').forEach((b) => {
      b.classList.toggle('is-active', b.getAttribute('data-set-lang') === lang);
    });
  }

  function showError(msg) {
    $('#ivLoading').hidden = true;
    $('#ivApp').hidden = true;
    $('#ivDone').hidden = true;
    $('#ivErrorTitle').textContent = I18N[lang].errTitle;
    $('#ivErrorDesc').textContent = msg;
    $('#ivError').hidden = false;
  }

  function renderMeta() {
    const t = I18N[lang];
    const a = state.applicant;
    const progLabel = a.program === 'short' ? t.progShort : t.progLong;
    $('#ivMeta').innerHTML =
      `<div class="kiv-meta-item"><dt>${t.lblId}</dt><dd>${escapeHtml(a.appId)}</dd></div>` +
      `<div class="kiv-meta-item"><dt>${t.lblName}</dt><dd>${escapeHtml(a.name)}</dd></div>` +
      `<div class="kiv-meta-item"><dt>${t.lblProgram}</dt><dd>${escapeHtml(progLabel)}</dd></div>` +
      `<div class="kiv-meta-item"><dt>${t.lblLang}</dt><dd>${escapeHtml(a.interviewLang || '−')}</dd></div>`;
  }

  function renderPicker() {
    const t = I18N[lang];
    const dates = [];
    const seen = new Set();
    state.slots.forEach((s) => {
      if (!seen.has(s.date)) { seen.add(s.date); dates.push(s.date); }
    });

    if (dates.length === 0) {
      $('#ivDates').innerHTML = `<p style="color:#64748b;">${t.noSlots}</p>`;
      $('#ivSlots').innerHTML = '';
      $('#ivSubmitBtn').disabled = true;
      return;
    }

    if (!state.selectedDate || !seen.has(state.selectedDate)) {
      const firstOpen = state.slots.find((s) => s.status === 'OPEN');
      state.selectedDate = firstOpen ? firstOpen.date : dates[0];
      state.selectedTime = null;
    }

    $('#ivDates').innerHTML = dates.map((d) => {
      const active = d === state.selectedDate ? ' is-active' : '';
      return `<button type="button" class="kiv-date-btn${active}" data-date="${escapeHtml(d)}">${escapeHtml(fmtDateLabel(d))}</button>`;
    }).join('');

    const daySlots = state.slots.filter((s) => s.date === state.selectedDate);
    $('#ivSlots').innerHTML = daySlots.map((s) => {
      const isBooked = s.status !== 'OPEN' && !s.mine;
      const isClosed = !!s.tooClose && !s.mine;
      const isDisabled = isBooked || isClosed;
      const isSel = state.selectedTime === s.time;
      const tag = isBooked ? t.bookedTag : (isClosed ? t.closedTag : '');
      return `<button type="button" class="kiv-slot${isSel ? ' is-selected' : ''}" data-time="${escapeHtml(s.time)}" ${isDisabled ? 'disabled' : ''}>` +
        `${escapeHtml(s.time)} JST${tag ? `<br><small>${tag}</small>` : ''}</button>`;
    }).join('');

    $('#ivSubmitBtn').disabled = !state.selectedTime;
    $('#ivSelectedPreview').textContent = state.selectedTime
      ? `${fmtDateLabel(state.selectedDate)} ${state.selectedTime} JST`
      : '';
  }

  function renderApp() {
    const t = I18N[lang];
    $('#ivLoading').hidden = true;
    $('#ivError').hidden = true;
    $('#ivDone').hidden = true;
    $('#ivApp').hidden = false;

    renderMeta();

    if (state.currentBooking) {
      $('#ivCurrentBox').hidden = false;
      $('#ivCurrentLabel').textContent = t.currentLbl;
      $('#ivCurrentTime').textContent = `${fmtDateLabel(state.currentBooking.date)} ${state.currentBooking.time} JST`;
      const curZoom = $('#ivCurrentZoom');
      if (state.currentBooking.zoomUrl) {
        curZoom.hidden = false;
        curZoom.innerHTML = `${escapeHtml(t.zoomLabel)}<a href="${escapeHtml(state.currentBooking.zoomUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(state.currentBooking.zoomUrl)}</a>`;
      } else {
        curZoom.hidden = true;
        curZoom.textContent = '';
      }
      if (state.lock && state.lock.locked) {
        $('#ivCurrentNote').textContent = t.currentNoteLocked;
        $('#ivRescheduleBtn').hidden = true;
      } else {
        const dl = (state.lock && state.lock.deadlineLabel)
          ? (lang === 'ja'
            ? `（変更締切: ${state.lock.deadlineLabel}／面接開始24時間前まで）`
            : ` (Deadline: ${state.lock.deadlineLabel} / up to 24h before interview)`)
          : '';
        $('#ivCurrentNote').textContent = t.currentNote + dl;
        $('#ivRescheduleBtn').hidden = false;
      }
      $('#ivPickerWrap').hidden = true;
    } else if (state.lock && state.lock.pastDeadline) {
      showError(t.errDeadline);
    } else {
      $('#ivCurrentBox').hidden = true;
      $('#ivPickerWrap').hidden = false;
      renderPicker();
    }
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async function loadInfo() {
    applyStaticText();
    if (!GAS_URL || !APP_ID || !TOKEN) {
      showError(I18N[lang].errMissing);
      return;
    }
    try {
      const url = `${GAS_URL}?action=interviewInfo&id=${encodeURIComponent(APP_ID)}&token=${encodeURIComponent(TOKEN)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.ok) {
        showError(I18N[lang].errNotFound);
        return;
      }
      state.applicant = data.applicant;
      state.currentBooking = data.currentBooking;
      state.lock = data.lock || {};
      state.slots = data.slots || [];
      if (!q.get('lang') && state.applicant.lang) {
        lang = state.applicant.lang;
        applyStaticText();
      }
      renderApp();
    } catch (e) {
      showError(I18N[lang].errNet);
    }
  }

  async function submitBooking() {
    if (!state.selectedDate || !state.selectedTime) return;
    const btn = $('#ivSubmitBtn');
    btn.disabled = true;
    btn.textContent = I18N[lang].submitting;
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'bookInterview',
          id: APP_ID,
          token: TOKEN,
          date: state.selectedDate,
          time: state.selectedTime,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        const msgMap = {
          taken: I18N[lang].errTaken,
          deadlinePassed: I18N[lang].errDeadline,
          tooClose: I18N[lang].errTooClose,
          slotTooClose: I18N[lang].errSlotTooClose,
        };
        alert(msgMap[data.code] || I18N[lang].errNet);
        await loadInfo();
        return;
      }
      state.currentBooking = data.booking;
      $('#ivApp').hidden = true;
      $('#ivDoneTime').textContent = `${fmtDateLabel(data.booking.date)} ${data.booking.time} JST`;
      const doneZoom = $('#ivDoneZoom');
      if (data.booking.zoomUrl) {
        doneZoom.hidden = false;
        doneZoom.innerHTML = `${escapeHtml(I18N[lang].zoomLabel)}<a href="${escapeHtml(data.booking.zoomUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(data.booking.zoomUrl)}</a>`;
        $('#ivDoneDesc').textContent = I18N[lang].doneDescWithZoom;
      } else {
        doneZoom.hidden = true;
        doneZoom.textContent = '';
        $('#ivDoneDesc').textContent = I18N[lang].doneDesc;
      }
      $('#ivDone').hidden = false;
    } catch (e) {
      alert(I18N[lang].errNet);
      btn.disabled = false;
      btn.textContent = I18N[lang].submit;
    }
  }

  document.addEventListener('click', (ev) => {
    const langBtn = ev.target.closest('[data-set-lang]');
    if (langBtn) {
      lang = langBtn.getAttribute('data-set-lang') === 'en' ? 'en' : 'ja';
      applyStaticText();
      if (state.applicant) renderApp();
      return;
    }
    const dateBtn = ev.target.closest('[data-date]');
    if (dateBtn) {
      state.selectedDate = dateBtn.getAttribute('data-date');
      state.selectedTime = null;
      renderPicker();
      return;
    }
    const timeBtn = ev.target.closest('[data-time]');
    if (timeBtn && !timeBtn.disabled) {
      state.selectedTime = timeBtn.getAttribute('data-time');
      renderPicker();
      return;
    }
  });

  $('#ivRescheduleBtn').addEventListener('click', () => {
    $('#ivPickerWrap').hidden = false;
    renderPicker();
  });
  $('#ivSubmitBtn').addEventListener('click', submitBooking);
  $('#ivReloadBtn').addEventListener('click', loadInfo);

  loadInfo();
})();
