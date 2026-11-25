/* ============================================================
 * Koganecho AIR 2027 — Online Application Form
 * Shared logic (index.html / en.html)
 * ============================================================ */
(function () {
  'use strict';

  /* ---------- Config & constants ---------- */
  const CONFIG = (typeof window.OPENCALL_CONFIG === 'object' && window.OPENCALL_CONFIG) || {};
  const GAS_URL = typeof CONFIG.gasUrl === 'string' && CONFIG.gasUrl.indexOf('PASTE_') !== 0 ? CONFIG.gasUrl : null;

  const OPEN_AT = Date.parse('2026-11-25T00:00:00+09:00');
  const CLOSE_AT = Date.parse('2027-01-06T18:00:00+09:00');
  const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB (Drive 요구치 256KB 배수)
  const DRAFT_KEY = 'kair2027_draft_v1';
  const SUBMISSION_KEY = 'kair2027_submission_v1';
  const UPLOAD_KINDS = ['portfolio', 'cv', 'statement'];
  const KIND_ORDER = { portfolio: 1, cv: 2, statement: 3 };

  const LANG = document.documentElement.lang === 'en' ? 'en' : 'ja';

  /* ---------- i18n (dynamic strings only; static text is in HTML) ---------- */
  const STR = {
    ja: {
      monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      monthLabel: (y, m, i) => y + '年' + m + '月（' + (i + 1) + 'か月目）',
      monthlyHint: '入居希望日に応じた月が表示されます（Step 2 で入居希望日を選択してください）。',
      statusBefore: '受付開始前です — 2026年12月6日(日) 0:00 JST に受付を開始します。',
      statusOpen: (d, h) => '受付中 — 締切（2027年1月6日(水) 18:00 JST）まで あと ' + d + '日 ' + h + '時間',
      statusClosed: '応募受付は終了しました（2027年1月6日 18:00 JST 締切）。',
      closedTitle: '現在、応募受付期間ではありません',
      closedBody: '受付期間: 2026年12月6日(日) ～ 2027年1月6日(水) 18:00（日本標準時）<br>受付期間中に、このページのフォームからお申し込みいただけます。',
      errRequired: (l) => l + 'を入力してください。',
      errSelect: (l) => l + 'を選択してください。',
      errEmail: '有効なメールアドレスを入力してください。',
      errEmailMatch: 'メールアドレス（確認用）が一致しません。',
      errDate: '正しい日付を入力してください。',
      errDateRange: '入居希望日は2027年2月1日以降の日付を指定してください。',
      errDateRangeShort: '短期プログラムの入居希望日は2027年2月1日～3月1日の間で指定してください。',
      errShareShortOnly: 'フラットシェアは短期プログラム専用です。別の居住形態を選択してください。',
      errSecondChoiceShare: '長期プログラムでは第2希望にフラットシェアを選べません。',
      errMonthlyNeedDate: '先にStep 2で入居希望日を選択すると、月別活動計画の入力欄が表示されます。',
      errMonthlyMin: '最初の3か月分の活動計画を入力してください。',
      errMinCheck: (l) => l + 'を1つ以上選択してください。',
      errGroupMembers: 'グループの人数（2名以上）を入力してください。',
      errCompanionCount: '同伴者の人数を入力してください。',
      errFileType: (l, t) => l + 'は ' + t + ' 形式のファイルを選択してください。',
      errFileSize: (l, max, cur) => l + 'は' + max + 'MB以下にしてください（選択されたファイル: ' + cur + 'MB）。',
      errAgree: '確認・同意事項のすべてのチェックボックスに同意してください。',
      errSignature: '同意の署名（お名前）を入力してください。',
      errFilesStep: '提出書類3点（ポートフォリオ・経歴書・ステートメント）をすべて選択してください。',
      srvClosed: 'サーバー側の確認により、応募受付期間外です（2027年1月6日 18:00 JST 締切）。',
      srvTooFast: 'フォームの入力時間が短すぎます。最初からやり直してください。',
      srvInvalid: '入力内容に不備があります。修正して再度送信してください。',
      srvToken: '申請の確認に失敗しました（トークン不一致）。お手数ですが再送してください。',
      srvNotFound: '申請が見つかりません。最初からやり直してください。',
      srvGrace: 'アップロード完了の連絡期限（締切後24時間）を過ぎています。air@koganecho.net までご連絡ください。',
      srvServer: 'サーバーでエラーが発生しました。しばらくしてから再度お試しください。',
      srvNoConfig: 'システム設定が未完了です（GAS URL未設定）。管理者にお問い合わせください。',
      netError: '通信エラーが発生しました。ネットワークを確認し、再度お試しください。',
      upPreparing: 'サーバー処理中…（受付番号の発行とアップロード準備をしています）',
      upUploading: 'アップロード中… {p}%',
      upDone: 'アップロード完了',
      upFailed: 'アップロード失敗',
      upFinalizing: '受領を確認しています…',
      upDoneTitle: 'お申し込みが完了しました',
      upDoneLead: '下記の受付番号で受け付けました。確認メールをお送りしましたのでご確認ください（迷惑メールフォルダもご確認ください）。',
      appIdLabel: '受付番号 / Application ID',
      nextTitle: '今後の予定',
      nextSteps: [
        '2027年1月7日～8日: 第一次書類選考',
        '2027年1月9日: 一次結果を全応募者に個別メールで通知',
        '一次通過者: Zoomオンライン面接（短期: 1月12日～15日／長期: 1月18日～25日）',
        '2027年1月27日: 最終結果を全応募者に個別メールで通知',
      ],
      retryUploads: 'アップロードを再試行',
      retryFinalize: '完了処理を再試行',
      backToForm: 'フォームに戻る',
      resumeBanner: '前回の申請（{id}）のファイルアップロードが未完了です。手続きを再開するには、提出書類を再度選択して送信してください（フォーム内容の変更は反映されません）。',
      resumeBtn: '再開する',
      discardBtn: '破棄する',
      draftBanner: '入力途中の下書き（{t}保存）があります。',
      draftRestore: '復元する',
      draftDiscard: '削除する',
      leaveWarning: '入力内容はまだ送信されていません。このまま移動すると失われます（一部は下書き保存されます）。',
      fieldNotAnswered: '（未回答）',
      filesNone: '未選択',
      yes: 'はい', no: 'いいえ',
    },
    en: {
      monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      monthLabel: (y, m, i) => STR.en.monthNames[m - 1] + ' ' + y + ' (Month ' + (i + 1) + ')',
      monthlyHint: 'Month fields appear according to your desired move-in date (set it in Step 2).',
      statusBefore: 'Applications open December 6, 2026 at 0:00 JST.',
      statusOpen: (d, h) => 'Open — closes in ' + d + 'd ' + h + 'h (Jan 6, 2027, 18:00 JST)',
      statusClosed: 'The application period has closed (Jan 6, 2027, 18:00 JST).',
      closedTitle: 'Applications Are Currently Closed',
      closedBody: 'Application period: Dec 6, 2026 – Jan 6, 2027, 18:00 (JST).<br>The form below is available during the application period.',
      errRequired: (l) => 'Please enter ' + l + '.',
      errSelect: (l) => 'Please select ' + l + '.',
      errEmail: 'Please enter a valid email address.',
      errEmailMatch: 'Email addresses do not match.',
      errDate: 'Please enter a valid date.',
      errDateRange: 'Desired move-in date must be February 1, 2027 or later.',
      errDateRangeShort: 'For the short-term program, the move-in date must be between Feb 1 and Mar 1, 2027.',
      errShareShortOnly: 'Shared flats are for the short-term program only. Please choose another living style.',
      errSecondChoiceShare: 'Shared flat cannot be a second choice for the long-term program.',
      errMonthlyNeedDate: 'Set your desired move-in date in Step 2 to show the month-by-month plan fields.',
      errMonthlyMin: 'Please fill in the activity plan for the first three months.',
      errMinCheck: (l) => 'Please select at least one: ' + l + '.',
      errGroupMembers: 'Enter the number of group members (2 or more).',
      errCompanionCount: 'Enter the number of accompanying persons.',
      errFileType: (l, t) => l + ' must be a ' + t + ' file.',
      errFileSize: (l, max, cur) => l + ' must be ' + max + 'MB or smaller (selected: ' + cur + 'MB).',
      errAgree: 'Please check all confirmation and consent boxes to proceed.',
      errSignature: 'Please type your full name as a signature.',
      errFilesStep: 'Please select all three documents (Portfolio, C.V., Artist Statement).',
      srvClosed: 'The application period has closed (Jan 6, 2027, 18:00 JST).',
      srvTooFast: 'The form was completed too quickly. Please start again.',
      srvInvalid: 'Some entries need correction. Please fix and resubmit.',
      srvToken: 'Verification failed (token mismatch). Please submit again.',
      srvNotFound: 'Application not found. Please start again.',
      srvGrace: 'The upload completion window (24h after the deadline) has passed. Please contact air@koganecho.net.',
      srvServer: 'A server error occurred. Please try again later.',
      srvNoConfig: 'System configuration is incomplete (GAS URL not set). Please contact the administrator.',
      netError: 'A network error occurred. Check your connection and try again.',
      upPreparing: 'Contacting server… (issuing your application ID and preparing uploads)',
      upUploading: 'Uploading… {p}%',
      upDone: 'Upload complete',
      upFailed: 'Upload failed',
      upFinalizing: 'Verifying received files…',
      upDoneTitle: 'Application Submitted',
      upDoneLead: 'We have received your application with the ID below. A confirmation email has been sent — please check your inbox (and spam folder).',
      appIdLabel: 'Application ID',
      nextTitle: 'What Happens Next',
      nextSteps: [
        'Jan 7–8, 2027: First-round document screening',
        'Jan 9, 2027: First-round results emailed to all applicants',
        'Shortlisted: Zoom interviews (short-term: Jan 12–15 / long-term: Jan 18–25)',
        'Jan 27, 2027: Final results emailed to all applicants',
      ],
      retryUploads: 'Retry upload',
      retryFinalize: 'Retry completion',
      backToForm: 'Back to form',
      resumeBanner: 'A previous application ({id}) has incomplete file uploads. To resume, re-select your documents and submit again (form edits will not be saved).',
      resumeBtn: 'Resume',
      discardBtn: 'Discard',
      draftBanner: 'An unfinished draft (saved {t}) was found on this device.',
      draftRestore: 'Restore',
      draftDiscard: 'Delete',
      leaveWarning: 'Your entries have not been submitted yet. Leaving now may lose them (a partial draft is saved).',
      fieldNotAnswered: '(not answered)',
      filesNone: 'Not selected',
      yes: 'Yes', no: 'No',
    },
  };
  const t = STR[LANG];

  /* ---------- DOM helpers ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const form = $('#applyForm');
  if (!form) return;

  const steps = $$('.kapp-step', form);
  const progressLis = $$('#kappProgress > li');
  const btnPrev = $('#btnPrev');
  const btnNext = $('#btnNext');
  const btnSubmit = $('#btnSubmit');
  const submitPanel = $('#submitPanel');
  const closedPanel = $('#closedPanel');
  const statusBanner = $('#statusBanner');
  const draftBanner = $('#draftBanner');
  const resumeBanner = $('#resumeBanner');
  const monthlyWrap = $('#monthlyPlan');

  const pageLoadedAt = Date.now();
  let currentStep = 1;
  let maxStepReached = 1;
  let windowState = null;      // 'before' | 'open' | 'closed'
  let submission = null;       // 진행 중 제출 상태 (localStorage 복원)
  let submissionFinished = false;

  /* ============================================================
   * Window status (JST) — client clock first, then server check
   * ============================================================ */
  function isPreviewMode() {
    try {
      const q = new URLSearchParams(location.search);
      if (q.get('preview') === '1' || q.get('preview') === 'true') return true;
      if (localStorage.getItem('kair2027_preview') === '1') return true;
    } catch (e) { /* noop */ }
    return false;
  }

  function clientWindowState() {
    if (isPreviewMode()) return 'open';
    const now = Date.now();
    if (now < OPEN_AT) return 'before';
    if (now > CLOSE_AT) return 'closed';
    return 'open';
  }

  function renderStatusBadge(state) {
    const badge = $('#statusBadge');
    if (!badge) return;
    const now = Date.now();
    badge.classList.remove('is-open', 'is-closed');
    if (state === 'open') {
      badge.classList.add('is-open');
      const ms = CLOSE_AT - now;
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      badge.textContent = t.statusOpen(d, h);
    } else if (state === 'before') {
      const ms = OPEN_AT - now;
      const d = Math.ceil(ms / 86400000);
      badge.textContent = t.statusBefore + (d > 0 ? ' (T-' + d + 'd)' : '');
    } else {
      badge.classList.add('is-closed');
      badge.textContent = t.statusClosed;
    }
  }

  function applyWindowState(state) {
    windowState = state;
    renderStatusBadge(state);
    const formAllowed = state === 'open';
    if (formAllowed) {
      if (closedPanel) closedPanel.hidden = true;
      form.hidden = false;
      if (statusBanner && state === 'open') statusBanner.hidden = true;
    } else {
      if (closedPanel) {
        $('#closedTitle').textContent = t.closedTitle;
        $('#closedBody').innerHTML = t.closedBody;
        closedPanel.hidden = false;
      }
      form.hidden = true;
      if (submitPanel) submitPanel.hidden = true;
    }
  }

  async function checkServerStatus() {
    if (!GAS_URL) return;
    try {
      const res = await fetch(GAS_URL + '?action=status', { method: 'GET' });
      const data = await res.json();
      if (data && data.ok) {
        const now = data.serverNow || Date.now();
        const state = now < OPEN_AT ? 'before' : (now > CLOSE_AT ? 'closed' : 'open');
        if (state !== windowState) applyWindowState(state);
      }
    } catch (err) { /* 서버 상태 조회 실패 시 클라 시간 기준 유지 */ }
  }

  /* ============================================================
   * Wizard navigation
   * ============================================================ */
  function goToStep(n, focus) {
    currentStep = n;
    maxStepReached = Math.max(maxStepReached, n);
    steps.forEach((s) => s.classList.toggle('is-visible', Number(s.dataset.step) === n));
    progressLis.forEach((li, i) => {
      li.classList.toggle('is-active', i + 1 === n);
      li.classList.toggle('is-done', i + 1 < n);
      li.classList.toggle('is-clickable', i + 1 <= maxStepReached && i + 1 !== n);
    });
    if (btnPrev) btnPrev.hidden = n === 1;
    if (btnNext) btnNext.hidden = n === 5;
    if (btnSubmit) btnSubmit.hidden = n !== 5;
    const hint = $('#navHint');
    if (hint) hint.textContent = (LANG === 'ja' ? 'Step ' : 'Step ') + n + ' / 5';
    clearErrorSummary();
    if (n === 5) buildReview();
    if (focus !== false) {
      const title = steps[n - 1].querySelector('.kapp-step-title');
      if (title) { title.setAttribute('tabindex', '-1'); title.focus({ preventScroll: true }); }
    }
    const stepEl = steps[n - 1];
    if (stepEl) stepEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function nextStep() {
    const errors = validateStep(currentStep);
    if (errors.length > 0) { showErrorSummary(errors); return; }
    if (currentStep < 5) goToStep(currentStep + 1);
  }

  progressLis.forEach((li, i) => {
    const btn = li.querySelector('button');
    if (btn) btn.addEventListener('click', () => {
      const target = i + 1;
      if (target <= maxStepReached && target !== currentStep) goToStep(target);
    });
  });
  if (btnPrev) btnPrev.addEventListener('click', () => { if (currentStep > 1) goToStep(currentStep - 1); });
  if (btnNext) btnNext.addEventListener('click', nextStep);

  /* ============================================================
   * Validation
   * ============================================================ */
  const val = (name) => {
    const el = form.elements[name];
    return el && el.value ? el.value.trim() : '';
  };
  const radioVal = (name) => {
    const el = form.elements[name];
    if (!el) return '';
    const checked = Array.from(el.length !== undefined ? el : [el]).find((x) => x.checked);
    return checked ? checked.value : '';
  };
  const num = (name) => Number(val(name));

  function labelOf(name) {
    const el = form.elements[name];
    if (!el) return name;
    // 라디오/체크박스 그룹(RadioNodeList)·셀렉트(HTMLOptionsCollection)는 첫 요소에서,
    // 단일 input/textarea 는 요소 자체에서 필드 컨테이너를 찾는다
    const one = (el.length !== undefined && el[0] && el[0].tagName) ? el[0] : el;
    const field = one.closest ? one.closest('.kapp-field') : null;
    if (!field) return name;
    const label = field.querySelector(':scope > label') || field.querySelector('.kapp-field-label');
    if (!label) return name;
    const clone = label.cloneNode(true);
    $$('.kapp-req, .kapp-sub, .kapp-optional', clone).forEach((n) => n.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function err(name, msg) {
    const el = form.elements[name];
    const first = el && el.length !== undefined && el[0] && el[0].type !== 'checkbox' ? el[0] : el;
    return { el: first, msg };
  }

  function validateStep(step) {
    const errors = [];
    const E = t;

    if (step === 1) {
      ['name', 'nameKana', 'nationality', 'birthDate', 'email', 'emailConfirm', 'phone', 'address'].forEach((n) => {
        if (!val(n)) errors.push(err(n, E.errRequired(labelOf(n))));
      });
      if (!radioVal('residence')) errors.push(err('residence', E.errSelect(labelOf('residence'))));
      if (val('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email'))) errors.push(err('email', E.errEmail));
      if (val('email') && val('emailConfirm') && val('email') !== val('emailConfirm')) errors.push(err('emailConfirm', E.errEmailMatch));
      if (val('birthDate')) {
        const d = Date.parse(val('birthDate'));
        if (isNaN(d) || d > Date.now()) errors.push(err('birthDate', E.errDate));
      }
      if (radioVal('applicantType') === 'group') {
        if (!(num('groupMembers') >= 2)) errors.push(err('groupMembers', E.errGroupMembers));
        if (!val('groupDetail')) errors.push(err('groupDetail', E.errRequired(labelOf('groupDetail'))));
      }
      if (radioVal('companionType') === 'yes') {
        if (!(num('companionCount') >= 1)) errors.push(err('companionCount', E.errCompanionCount));
        if (!val('companionDetail')) errors.push(err('companionDetail', E.errRequired(labelOf('companionDetail'))));
      }
    }

    if (step === 2) {
      const program = radioVal('program');
      const purpose = radioVal('studioPurpose');
      if (!program) errors.push(err('program', E.errSelect(labelOf('program'))));
      if (!purpose) errors.push(err('studioPurpose', E.errSelect(labelOf('studioPurpose'))));
      if (purpose === 'residential' && !radioVal('livingStyle')) errors.push(err('livingStyle', E.errSelect(labelOf('livingStyle'))));
      if (program === 'long' && radioVal('livingStyle') === 'share') {
        errors.push(err('livingStyle', E.errShareShortOnly));
      }
      if (program === 'long' && val('secondChoice') === 'share') {
        errors.push(err('secondChoice', E.errSecondChoiceShare));
      }
      const mid = val('moveInDate');
      if (!mid) {
        errors.push(err('moveInDate', E.errSelect(labelOf('moveInDate'))));
      } else {
        const d = Date.parse(mid + 'T00:00:00+09:00');
        if (isNaN(d)) errors.push(err('moveInDate', E.errDate));
        else if (d < Date.parse('2027-02-01T00:00:00+09:00')) errors.push(err('moveInDate', E.errDateRange));
        else if (program === 'short' && d > Date.parse('2027-03-01T00:00:00+09:00')) errors.push(err('moveInDate', E.errDateRangeShort));
      }
      if (!radioVal('interviewLang')) errors.push(err('interviewLang', E.errSelect(labelOf('interviewLang'))));
    }

    if (step === 3) {
      const checked = $$('input[name="disciplines"]:checked', form);
      if (checked.length === 0) errors.push(err('disciplines', E.errMinCheck(labelOf('disciplines'))));
      const otherCb = $('input[name="disciplines"][value="other"]', form);
      if (otherCb && otherCb.checked && !val('disciplineOtherText')) {
        errors.push(err('disciplineOtherText', E.errRequired(labelOf('disciplineOtherText'))));
      }
      if (!val('activityOverview')) errors.push(err('activityOverview', E.errRequired(labelOf('activityOverview'))));
      const monthInputs = getMonthlyInputs();
      if (monthInputs.length === 0) {
        errors.push({ el: monthlyWrap, msg: E.errMonthlyNeedDate });
      } else {
        const missing = monthInputs.slice(0, 3).filter((i) => !i.value.trim());
        if (missing.length > 0) errors.push({ el: monthlyWrap, msg: E.errMonthlyMin });
      }
    }

    if (step === 4) {
      UPLOAD_KINDS.forEach((kind) => {
        if (!stateFiles[kind]) errors.push({ el: $('[data-dropzone="' + kind + '"]'), msg: E.errFilesStep });
      });
    }

    if (step === 5) {
      ['agreeFees', 'agreeDeposit', 'agreeShortTerm', 'agreeRules', 'agreeVisa', 'agreePrivacy'].forEach((n) => {
        const cb = form.elements[n];
        if (!cb || !cb.checked) {
          errors.push({ el: cb, msg: E.errAgree });
        }
      });
      if (!val('signature')) errors.push(err('signature', E.errSignature));
    }

    return errors;
  }

  function showErrorSummary(errors) {
    const stepEl = steps[currentStep - 1];
    let box = $('.kapp-error-summary', stepEl);
    if (!box) {
      box = document.createElement('div');
      box.className = 'kapp-error-summary';
      box.setAttribute('role', 'alert');
      stepEl.prepend(box);
    }
    const seen = new Set();
    const items = errors.filter((e) => { const k = e.msg; if (seen.has(k)) return false; seen.add(k); return true; });
    box.innerHTML =
      '<h3>' + (LANG === 'ja' ? '入力内容をご確認ください' : 'Please check your entries') + '</h3><ul>' +
      items.map((e) => '<li>' + escapeHtml(e.msg) + '</li>').join('') +
      '</ul>';
    errors.forEach((e) => {
      if (e.el && e.el.setAttribute && e.el.type !== 'checkbox' && e.el.type !== 'radio') e.el.setAttribute('aria-invalid', 'true');
    });
    const first = errors[0];
    if (first && first.el && first.el.focus) {
      try { first.el.focus({ preventScroll: false }); } catch (e) { /* noop */ }
    }
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function clearErrorSummary() {
    steps.forEach((s) => { const b = $('.kapp-error-summary', s); if (b) b.remove(); });
    $$('[aria-invalid="true"]', form).forEach((el) => el.removeAttribute('aria-invalid'));
    $$('.kapp-agree-item.is-invalid', form).forEach((el) => el.classList.remove('is-invalid'));
  }

  /* ============================================================
   * Conditional fields
   * ============================================================ */
  function refreshConditionals() {
    const show = (sel, on) => { const el = $(sel); if (el) el.hidden = !on; };

    show('#groupFields', radioVal('applicantType') === 'group');
    show('#companionFields', radioVal('companionType') === 'yes');

    const purpose = radioVal('studioPurpose');
    show('#livingStyleField', purpose === 'residential');

    // 플랫셰어는 단기 전용: 장기 선택 시 비활성화
    const program = radioVal('program');
    const shareCard = $('input[name="livingStyle"][value="share"]', form);
    const shareNote = $('#shareShortNote');
    if (shareCard) {
      const disabled = program === 'long';
      shareCard.disabled = disabled;
      const card = shareCard.closest('.kapp-option-card');
      if (card) card.classList.toggle('is-disabled', disabled);
      if (shareNote) shareNote.hidden = program !== 'long';
      if (disabled && shareCard.checked) {
        const either = $('input[name="livingStyle"][value="either"]', form);
        if (either) either.checked = true;
      }
    }

    // 제2희망의 플랫셰어도 단기 전용
    const secondSel = form.elements['secondChoice'];
    if (secondSel) {
      const shareOpt = $$('option', secondSel).find((o) => o.value === 'share');
      if (shareOpt) {
        shareOpt.disabled = program === 'long';
        shareOpt.hidden = program === 'long';
      }
      if (program === 'long' && secondSel.value === 'share') secondSel.value = 'none';
    }

    // 입주 희망일 범위 갱신
    const dateInput = form.elements['moveInDate'];
    if (dateInput) {
      if (program === 'short') {
        dateInput.min = '2027-02-01';
        dateInput.max = '2027-03-01';
        if (dateInput.value && dateInput.value > '2027-03-01') dateInput.value = '';
      } else if (program === 'long') {
        dateInput.min = '2027-02-01';
        dateInput.removeAttribute('max');
      } else {
        dateInput.min = '2027-02-01';
        dateInput.removeAttribute('max');
      }
    }

    show('#disciplineOtherField', !!($('input[name="disciplines"][value="other"]:checked', form)));
  }

  ['applicantType', 'companionType', 'program', 'studioPurpose', 'livingStyle', 'interviewLang'].forEach((name) => {
    $$('input[name="' + name + '"]', form).forEach((el) => el.addEventListener('change', () => { refreshConditionals(); renderMonthlyPlan(); }));
  });
  $$('input[name="disciplines"]', form).forEach((el) => el.addEventListener('change', refreshConditionals));
  form.elements['moveInDate'].addEventListener('change', renderMonthlyPlan);

  /* ============================================================
   * Monthly activity plan (dynamic)
   * ============================================================ */
  function getMonthlyInputs() {
    return $$('textarea[data-month]', monthlyWrap);
  }

  function programMonthCount(program) {
    if (program === 'short') return 3;
    if (program === 'long') return 12;
    return 0;
  }

  function renderMonthlyPlan() {
    if (!monthlyWrap) return;
    const program = radioVal('program');
    const mid = val('moveInDate');
    const count = programMonthCount(program);

    // 기존 입력값 보존 (월 키 기준)
    const prev = {};
    getMonthlyInputs().forEach((i) => { prev[i.dataset.month] = i.value; });

    if (!mid || count === 0) {
      monthlyWrap.innerHTML =
        '<div class="kapp-info-box"><p>' + t.monthlyHint + '</p></div>';
      return;
    }

    const parts = mid.split('-').map(Number);
    const startY = parts[0], startM = parts[1];
    let html = '';
    for (let i = 0; i < count; i++) {
      const dt = new Date(Date.UTC(startY, startM - 1 + i, 1));
      const y = dt.getUTCFullYear();
      const m = dt.getUTCMonth() + 1;
      const key = y + '-' + String(m).padStart(2, '0');
      const label = t.monthLabel(y, m, i);
      const required = i < 3;
      html +=
        '<div class="kapp-monthly-item">' +
          '<div class="kapp-monthly-label">' + escapeHtml(label) + (required ? ' <span class="kapp-req">*</span>' : '') + '</div>' +
          '<textarea class="kapp-textarea" data-month="' + key + '" ' +
            (required ? 'required aria-required="true"' : '') + ' ' +
            'placeholder="' + (LANG === 'ja'
              ? 'この月の活動内容（例: リサーチ、制作、展示準備、地域交流など）'
              : 'Activities this month (e.g., research, production, exhibition prep, community exchange)') + '">' +
            escapeHtml(prev[key] || '') + '</textarea>' +
        '</div>';
    }
    monthlyWrap.innerHTML = html;
    getMonthlyInputs().forEach((i) => i.addEventListener('input', scheduleDraftSave));
  }

  /* ============================================================
   * File handling
   * ============================================================ */
  const FILE_RULES = {
    portfolio: { maxBytes: 120 * 1024 * 1024, types: ['application/pdf'], exts: ['.pdf'], typeLabel: 'PDF' },
    cv: {
      maxBytes: 10 * 1024 * 1024,
      types: ['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      exts: ['.pdf', '.doc', '.docx'],
      typeLabel: 'PDF / Word',
    },
    statement: {
      maxBytes: 10 * 1024 * 1024,
      types: ['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      exts: ['.pdf', '.doc', '.docx'],
      typeLabel: 'PDF / Word',
    },
  };

  function resolveFileMime(file, rule) {
    if (file.type && rule.types.indexOf(file.type) >= 0) return file.type;
    const lower = (file.name || '').toLowerCase();
    if (lower.endsWith('.pdf') && rule.exts.indexOf('.pdf') >= 0) return 'application/pdf';
    if (lower.endsWith('.docx') && rule.exts.indexOf('.docx') >= 0) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    if (lower.endsWith('.doc') && rule.exts.indexOf('.doc') >= 0) return 'application/msword';
    return '';
  }

  const stateFiles = {};
  const stateFileMimes = {};

  function setFile(kind, file) {
    const card = $('[data-filecard="' + kind + '"]');
    const zone = $('[data-dropzone="' + kind + '"]');
    const rule = FILE_RULES[kind];
    stateFiles[kind] = null;
    delete stateFileMimes[kind];

    if (!file) {
      if (card) card.classList.remove('is-visible', 'is-error');
      if (zone) zone.classList.remove('is-hidden');
      return;
    }

    const effectiveMime = resolveFileMime(file, rule);
    if (!effectiveMime) {
      showFileError(kind, t.errFileType(labelOfFile(kind), rule.typeLabel));
      return;
    }
    if (file.size > rule.maxBytes) {
      showFileError(kind, t.errFileSize(labelOfFile(kind), Math.round(rule.maxBytes / 1048576), formatMb(file.size)));
      return;
    }
    if (file.size === 0) {
      showFileError(kind, t.errFileType(labelOfFile(kind), rule.typeLabel));
      return;
    }

    stateFiles[kind] = file;
    stateFileMimes[kind] = effectiveMime;
    if (zone) zone.classList.add('is-hidden');
    if (card) {
      card.classList.add('is-visible');
      card.classList.remove('is-error');
      $('.kapp-filecard-name', card).textContent = file.name;
      $('.kapp-filecard-meta', card).textContent = formatMb(file.size) + ' MB · ' + (effectiveMime === 'application/pdf' ? 'PDF' : 'Word');
    }
  }

  function showFileError(kind, msg) {
    const card = $('[data-filecard="' + kind + '"]');
    const zone = $('[data-dropzone="' + kind + '"]');
    if (zone) zone.classList.remove('is-hidden');
    if (card) {
      card.classList.add('is-visible', 'is-error');
      $('.kapp-filecard-name', card).textContent = msg;
      $('.kapp-filecard-meta', card).textContent = '';
    }
  }

  function labelOfFile(kind) {
    const el = $('[data-dropzone="' + kind + '"] .kapp-filezone-title');
    return el ? el.textContent.trim() : kind;
  }

  UPLOAD_KINDS.forEach((kind) => {
    const input = $('input[type="file"][data-kind="' + kind + '"]', form);
    const zone = $('[data-dropzone="' + kind + '"]');
    if (input) input.addEventListener('change', () => setFile(kind, input.files[0] || null));
    if (zone) {
      const chooseBtn = $('.kapp-btn-choose', zone);
      if (chooseBtn) chooseBtn.addEventListener('click', () => input.click());
      zone.addEventListener('dragover', (ev) => { ev.preventDefault(); zone.classList.add('is-dragover'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('is-dragover'));
      zone.addEventListener('drop', (ev) => {
        ev.preventDefault();
        zone.classList.remove('is-dragover');
        const f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
        if (f) setFile(kind, f);
      });
    }
    const card = $('[data-filecard="' + kind + '"]');
    if (card) {
      const unlink = $('.kapp-btn-unlink', card);
      if (unlink) unlink.addEventListener('click', () => {
        if (input) input.value = '';
        setFile(kind, null);
      });
    }
  });

  function formatMb(bytes) {
    return (Math.round((bytes / 1048576) * 10) / 10).toFixed(1);
  }

  /* ============================================================
   * Draft autosave
   * ============================================================ */
  let draftTimer = null;
  function scheduleDraftSave() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraft, 800);
  }

  function serializeForm() {
    const data = {};
    Array.from(form.elements).forEach((el) => {
      if (!el.name || el.type === 'file' || el.name === 'websiteUrl') return;
      if (el.type === 'checkbox') data[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
      else data[el.name] = el.value;
    });
    getMonthlyInputs().forEach((i) => { data['monthly_' + i.dataset.month] = i.value; });
    return data;
  }

  function saveDraft() {
    if (submissionFinished) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), fields: serializeForm() }));
    } catch (e) { /* 저장소 접근 불가 시 무시 */ }
  }

  function applyDraft(fields) {
    Object.keys(fields).forEach((key) => {
      if (key.indexOf('monthly_') === 0) return;
      const el = form.elements[key];
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!fields[key];
      else if (typeof fields[key] === 'string' && el.value !== undefined) {
        if (el.length && el[0] && el[0].type === 'radio') {
          Array.from(el).forEach((r) => { r.checked = r.value === fields[key]; });
        } else {
          el.value = fields[key];
        }
      }
    });
    refreshConditionals();
    renderMonthlyPlan();
    Object.keys(fields).forEach((key) => {
      if (key.indexOf('monthly_') !== 0) return;
      const mkey = key.slice('monthly_'.length);
      const ta = $('textarea[data-month="' + mkey + '"]', monthlyWrap);
      if (ta) ta.value = fields[key];
    });
  }

  function restoreDraftPrompt() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (e) { saved = null; }
    if (!saved || !saved.fields) return;
    const when = new Date(saved.savedAt);
    const timeStr = when.toLocaleDateString(LANG === 'ja' ? 'ja-JP' : 'en-US') + ' ' +
      when.toLocaleTimeString(LANG === 'ja' ? 'ja-JP' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    showBanner(draftBanner, t.draftBanner.replace('{t}', timeStr), [
      { label: t.draftRestore, onClick: () => { applyDraft(saved.fields); draftBanner.hidden = true; } },
      { label: t.draftDiscard, onClick: () => { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} draftBanner.hidden = true; } },
    ]);
  }

  /* ============================================================
   * Submission resume prompt
   * ============================================================ */
  function loadSubmission() {
    try { return JSON.parse(localStorage.getItem(SUBMISSION_KEY) || 'null'); } catch (e) { return null; }
  }

  function persistSubmission() {
    try { localStorage.setItem(SUBMISSION_KEY, JSON.stringify(submission)); } catch (e) { /* noop */ }
  }

  function restoreSubmissionPrompt() {
    const saved = loadSubmission();
    if (!saved || !saved.applicationId) return;
    submission = saved;
    showBanner(resumeBanner, t.resumeBanner.replace('{id}', saved.applicationId), [
      {
        label: t.resumeBtn,
        onClick: () => {
          resumeBanner.hidden = true;
          goToStep(4);
        },
      },
      {
        label: t.discardBtn,
        onClick: () => {
          try { localStorage.removeItem(SUBMISSION_KEY); } catch (e) {}
          submission = null;
          resumeBanner.hidden = true;
        },
      },
    ]);
  }

  function showBanner(el, text, actions) {
    if (!el) return;
    el.innerHTML = '<span>' + escapeHtml(text) + '</span>';
    const wrap = document.createElement('div');
    wrap.className = 'kapp-banner-actions';
    actions.forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'kapp-btn kapp-btn-secondary';
      b.style.padding = '7px 14px';
      b.style.fontSize = '12.5px';
      b.textContent = a.label;
      b.addEventListener('click', a.onClick);
      wrap.appendChild(b);
    });
    el.appendChild(wrap);
    el.hidden = false;
  }

  /* ============================================================
   * Review (Step 5)
   * ============================================================ */
  function checkedLabels(name) {
    return $$('input[name="' + name + '"]:checked', form).map((el) => {
      const item = el.closest('.kapp-check-item') || el.closest('.kapp-option-card');
      const vlabel = item ? item.querySelector('[data-vlabel]') : null;
      return vlabel ? vlabel.getAttribute('data-vlabel') : el.value;
    });
  }

  function radioLabel(name) {
    const el = $('input[name="' + name + '"]:checked', form);
    if (!el) return '';
    const item = el.closest('.kapp-option-card');
    const vlabel = item ? item.querySelector('[data-vlabel]') : null;
    return vlabel ? vlabel.getAttribute('data-vlabel') : el.value;
  }

  function selectLabel(name) {
    const el = form.elements[name];
    if (!el || !el.selectedOptions || !el.selectedOptions[0]) return '';
    return el.selectedOptions[0].textContent.trim();
  }

  function buildReview() {
    const body = $('#reviewBody');
    if (!body) return;
    const na = t.fieldNotAnswered;
    const row = (label, value) =>
      '<div class="kapp-review-row"><dt>' + escapeHtml(label) + '</dt><dd>' +
      (value === '' || value === undefined || value === null ? na : value) + '</dd></div>';

    const groupBlock = radioVal('applicantType') === 'group'
      ? row(labelOf('groupMembers'), String(val('groupMembers'))) + row(labelOf('groupDetail'), escapeHtml(val('groupDetail')))
      : '';
    const companionBlock = radioVal('companionType') === 'yes'
      ? row(labelOf('companionCount'), String(val('companionCount'))) + row(labelOf('companionDetail'), escapeHtml(val('companionDetail')))
      : row(labelOf('companionType'), radioLabel('companionType'));

    const monthlyHtml = getMonthlyInputs().map((i) => {
      const label = i.closest('.kapp-monthly-item').querySelector('.kapp-monthly-label').textContent.replace('*', '').trim();
      return row(label, escapeHtml(i.value.trim()));
    }).join('');

    const fileRow = (kind) => {
      const f = stateFiles[kind];
      return row(labelOfFile(kind), f ? escapeHtml(f.name) + ' <span class="kapp-sub">(' + formatMb(f.size) + ' MB)</span>' : t.filesNone);
    };

    body.innerHTML =
      '<div class="kapp-review-section">' +
        '<div class="kapp-review-head"><h3>' + (LANG === 'ja' ? '申請者情報' : 'Applicant') + '</h3>' +
        '<button type="button" class="kapp-review-edit" data-goto-step="1">' + (LANG === 'ja' ? '修正' : 'Edit') + '</button></div>' +
        '<div class="kapp-review-body"><dl>' +
          row(labelOf('name'), escapeHtml(val('name'))) +
          row(labelOf('nameKana'), escapeHtml(val('nameKana'))) +
          (val('artistName') ? row(labelOf('artistName'), escapeHtml(val('artistName'))) : '') +
          row(labelOf('residence'), radioLabel('residence')) +
          row(labelOf('nationality'), escapeHtml(val('nationality'))) +
          row(labelOf('birthDate'), escapeHtml(val('birthDate'))) +
          row(labelOf('email'), escapeHtml(val('email'))) +
          row(labelOf('phone'), escapeHtml(val('phone'))) +
          row(labelOf('address'), escapeHtml(val('address'))) +
          (val('website') ? row(labelOf('website'), escapeHtml(val('website'))) : '') +
          row(labelOf('applicantType'), radioLabel('applicantType')) + groupBlock + companionBlock +
        '</dl></div>' +
      '</div>' +
      '<div class="kapp-review-section">' +
        '<div class="kapp-review-head"><h3>' + (LANG === 'ja' ? 'プログラム・スタジオ' : 'Program & Studio') + '</h3>' +
        '<button type="button" class="kapp-review-edit" data-goto-step="2">' + (LANG === 'ja' ? '修正' : 'Edit') + '</button></div>' +
        '<div class="kapp-review-body"><dl>' +
          row(labelOf('program'), radioLabel('program')) +
          row(labelOf('studioPurpose'), radioLabel('studioPurpose')) +
          (radioVal('studioPurpose') === 'residential' ? row(labelOf('livingStyle'), radioLabel('livingStyle')) : '') +
          row(labelOf('secondChoice'), selectLabel('secondChoice')) +
          row(labelOf('moveInDate'), escapeHtml(val('moveInDate'))) +
          row(labelOf('interviewLang'), radioLabel('interviewLang')) +
        '</dl></div>' +
      '</div>' +
      '<div class="kapp-review-section">' +
        '<div class="kapp-review-head"><h3>' + (LANG === 'ja' ? '活動計画' : 'Activity Plan') + '</h3>' +
        '<button type="button" class="kapp-review-edit" data-goto-step="3">' + (LANG === 'ja' ? '修正' : 'Edit') + '</button></div>' +
        '<div class="kapp-review-body"><dl>' +
          row(labelOf('activityOverview'), escapeHtml(val('activityOverview'))) +
          (checkedLabels('disciplines').length ? row(labelOf('disciplines'), checkedLabels('disciplines').map(escapeHtml).join(', ') +
            (val('disciplineOtherText') ? ' (' + escapeHtml(val('disciplineOtherText')) + ')' : '')) : '') +
          (val('materialsNotes') ? row(labelOf('materialsNotes'), escapeHtml(val('materialsNotes'))) : '') +
          monthlyHtml +
        '</dl></div>' +
      '</div>' +
      '<div class="kapp-review-section">' +
        '<div class="kapp-review-head"><h3>' + (LANG === 'ja' ? '提出書類' : 'Documents') + '</h3>' +
        '<button type="button" class="kapp-review-edit" data-goto-step="4">' + (LANG === 'ja' ? '修正' : 'Edit') + '</button></div>' +
        '<div class="kapp-review-body"><dl>' +
          fileRow('portfolio') +
          (val('mediaUrls') ? row(labelOf('mediaUrls'), escapeHtml(val('mediaUrls'))) : '') +
          fileRow('cv') + fileRow('statement') +
        '</dl></div>' +
      '</div>' +
      '<div class="kapp-review-section">' +
        '<div class="kapp-review-head"><h3>' + (LANG === 'ja' ? '署名' : 'Signature') + '</h3></div>' +
        '<div class="kapp-review-body"><dl>' +
          row(labelOf('signature'), escapeHtml(val('signature'))) +
        '</dl></div>' +
      '</div>';

    $$('.kapp-review-edit', body).forEach((b) =>
      b.addEventListener('click', () => goToStep(Number(b.dataset.gotoStep))));
  }

  /* ============================================================
   * Payload
   * ============================================================ */
  function buildPayload() {
    const monthly = getMonthlyInputs().map((i) => ({ month: i.dataset.month, text: i.value.trim() }));
    return {
      action: 'submit',
      lang: LANG,
      honeypot: val('websiteUrl'),
      elapsedMs: Date.now() - pageLoadedAt,
      name: val('name'),
      nameKana: val('nameKana'),
      artistName: val('artistName'),
      nationality: val('nationality'),
      residence: radioVal('residence'),
      secondChoice: val('secondChoice'),
      birthDate: val('birthDate'),
      email: val('email'),
      phone: val('phone'),
      address: val('address'),
      website: val('website'),
      mediaUrls: val('mediaUrls'),
      applicantType: radioVal('applicantType'),
      groupMembers: num('groupMembers') || 0,
      groupDetail: val('groupDetail'),
      companionType: radioVal('companionType'),
      companionCount: num('companionCount') || 0,
      companionDetail: val('companionDetail'),
      program: radioVal('program'),
      studioPurpose: radioVal('studioPurpose'),
      livingStyle: radioVal('studioPurpose') === 'residential' ? radioVal('livingStyle') : 'na',
      moveInDate: val('moveInDate'),
      interviewLang: radioVal('interviewLang'),
      interviewSlot: '',
      activityOverview: val('activityOverview'),
      monthlyPlan: monthly,
      disciplines: checkedLabels('disciplines'),
      disciplineOther: val('disciplineOtherText'),
      workEnv: [],
      materialsNotes: val('materialsNotes'),
      uploads: UPLOAD_KINDS.filter((k) => stateFiles[k]).map((k) => ({
        kind: k,
        name: stateFiles[k].name,
        size: stateFiles[k].size,
        // 브라우저가 type="" / octet-stream 을 주는 경우가 있어 확장자 보정 MIME을 보낸다
        type: stateFileMimes[k] || resolveFileMime(stateFiles[k], FILE_RULES[k]) || stateFiles[k].type,
      })),
      agreements: {
        fees: form.elements['agreeFees'].checked,
        deposit: form.elements['agreeDeposit'].checked,
        shortTerm: form.elements['agreeShortTerm'].checked,
        rules: form.elements['agreeRules'].checked,
        visa: form.elements['agreeVisa'].checked,
        privacy: form.elements['agreePrivacy'].checked,
      },
      signature: val('signature'),
    };
  }

  /* ============================================================
   * GAS communication
   * ============================================================ */
  async function postGas(payload, timeoutMs) {
    if (!GAS_URL) throw new Error('no_config');
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs || 60000);
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: ctl.signal,
      });
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  /* ============================================================
   * Chunked resumable upload (진행률 표시)
   * ============================================================ */
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  function putRange(url, blob, start, total, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      const end = start + blob.size;
      xhr.setRequestHeader('Content-Range', 'bytes ' + start + '-' + (end - 1) + '/' + total);
      xhr.onload = () => {
        if (xhr.status === 308 || (xhr.status >= 200 && xhr.status < 300)) resolve(xhr);
        else reject(new Error('HTTP ' + xhr.status));
      };
      xhr.onerror = () => reject(new Error('network'));
      if (onProgress) {
        xhr.upload.onprogress = (ev) => onProgress(start + ev.loaded);
      }
      xhr.send(blob);
    });
  }

  function queryOffset(url, total) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      xhr.setRequestHeader('Content-Range', 'bytes */' + total);
      xhr.onload = () => {
        if (xhr.status === 308) {
          const range = xhr.getResponseHeader('Range');
          const m = range && range.match(/bytes=0-(\d+)/);
          resolve(m ? Number(m[1]) + 1 : null);
        } else if (xhr.status >= 200 && xhr.status < 300) {
          resolve(total);
        } else {
          resolve(null);
        }
      };
      xhr.onerror = () => resolve(null);
      xhr.send();
    });
  }

  async function uploadResumable(url, file, onProgress) {
    const total = file.size;
    if (total === 0) {
      await putRange(url, new Blob([]), 0, 0, null);
      onProgress(1);
      return;
    }
    let offset = 0;
    let failures = 0;
    while (offset < total) {
      const end = Math.min(offset + CHUNK_SIZE, total);
      const chunk = file.slice(offset, end);
      try {
        const xhr = await putRange(url, chunk, offset, total, (loaded) => {
          onProgress(Math.min(loaded / total, 0.999));
        });
        offset = end;
        failures = 0;
        if (xhr.status === 200 || xhr.status === 201) {
          onProgress(1);
          return;
        }
      } catch (e) {
        failures++;
        if (failures > 4) throw e;
        const cur = await queryOffset(url, total);
        if (cur !== null) offset = Math.min(cur, total);
        await sleep(1200 * failures);
      }
    }
    onProgress(1);
  }

  /* ============================================================
   * Submit flow
   * ============================================================ */
  function setPhase(phase) {
    ['phasePrepare', 'phaseUpload', 'phaseDone', 'phaseError'].forEach((id) => {
      const el = $('#' + id);
      if (el) el.hidden = id !== 'phase' + phase;
    });
  }

  function showSubmitPanel() {
    form.hidden = true;
    submitPanel.hidden = false;
    setPhase('Prepare');
    $('#phaseLead').textContent = t.upPreparing;
    submitPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function backToForm(message) {
    submitPanel.hidden = true;
    form.hidden = false;
    if (message) showErrorSummary([{ el: null, msg: message }]);
    goToStep(Math.min(currentStep, 5));
  }

  async function runSubmission() {
    const step5Errors = validateStep(5);
    if (step5Errors.length > 0) { showErrorSummary(step5Errors); return; }
    buildReview();
    showSubmitPanel();

    try {
      // 1) GAS submit (이미 발급받은 세션이 있으면 스킵 — 재개)
      if (!submission || !submission.uploads) {
        const res = await postGas(buildPayload());
        if (!res.ok) { handleGasError(res); return; }
        submission = {
          applicationId: res.applicationId,
          token: res.token,
          uploads: res.uploads,
          files: {},
          startedAt: Date.now(),
        };
        UPLOAD_KINDS.forEach((k) => {
          submission.files[k] = { name: stateFiles[k] ? stateFiles[k].name : '', uploaded: false };
        });
        persistSubmission();
      }

      // 2) 파일 업로드 (순차, 진행률 표시)
      setPhase('Upload');
      renderUploadRows();
      for (const kind of UPLOAD_KINDS) {
        const file = stateFiles[kind];
        const meta = submission.uploads[kind];
        if (!file || !meta) {
          updateUploadRow(kind, 0, t.upFailed, 'error');
          throw new Error('missing_file_' + kind);
        }
        if (submission.files[kind] && submission.files[kind].uploaded) {
          updateUploadRow(kind, 1, t.upDone, 'done');
          continue;
        }
        await uploadResumable(meta.uploadUrl, file, (frac) => {
          updateUploadRow(kind, frac, t.upUploading.replace('{p}', String(Math.round(frac * 100))), '');
        });
        submission.files[kind] = { name: file.name, uploaded: true };
        persistSubmission();
        updateUploadRow(kind, 1, t.upDone, 'done');
      }

      // 3) finalize
      setUploadOverall(t.upFinalizing);
      const fin = await postGas({
        action: 'finalize',
        applicationId: submission.applicationId,
        token: submission.token,
        files: {
          portfolio: submission.files.portfolio ? submission.files.portfolio.name : '',
          cv: submission.files.cv ? submission.files.cv.name : '',
          statement: submission.files.statement ? submission.files.statement.name : '',
        },
      });
      if (!fin.ok) { handleGasError(fin); return; }

      // 4) 완료
      submissionFinished = true;
      try { localStorage.removeItem(SUBMISSION_KEY); } catch (e) {}
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
      showDone();
    } catch (err) {
      if (err && err.message === 'no_config') {
        showErrorPhase(t.srvNoConfig);
      } else if (err && err.name === 'AbortError') {
        showErrorPhase(t.netError);
      } else if (err && err.gasResponse) {
        handleGasError(err.gasResponse);
      } else {
        showErrorPhase(t.netError + ' (' + ((err && err.message) || '') + ')', [
          { label: t.retryUploads, onClick: () => runSubmission() },
          { label: t.backToForm, onClick: () => backToForm() },
        ]);
      }
    }
  }

  function renderUploadRows() {
    const wrap = $('#uploadRows');
    if (!wrap) return;
    wrap.innerHTML = UPLOAD_KINDS.map((kind) => {
      const meta = submission && submission.uploads ? submission.uploads[kind] : null;
      const fname = meta ? meta.fileName : (stateFiles[kind] ? stateFiles[kind].name : kind);
      const fsize = stateFiles[kind] ? formatMb(stateFiles[kind].size) + ' MB' : '';
      const label = kindLabel(kind);
      return (
        '<div class="kapp-upload-row" data-upload-row="' + kind + '">' +
          '<div><span class="kapp-upload-name">' + escapeHtml(label) + '</span>' +
          '<span class="kapp-upload-meta">' + escapeHtml(fname) + (fsize ? ' · ' + fsize : '') + '</span></div>' +
          '<div>' +
            '<div class="kapp-progressbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="' + escapeHtml(label) + '">' +
              '<div class="kapp-progressbar-fill"></div>' +
            '</div>' +
            '<div class="kapp-upload-status" aria-live="polite">—</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function kindLabel(kind) {
    const el = $('[data-dropzone="' + kind + '"] .kapp-filezone-title');
    return el ? el.textContent.trim() : kind;
  }

  function updateUploadRow(kind, frac, statusText, statusClass) {
    const row = $('[data-upload-row="' + kind + '"]');
    if (!row) return;
    const fill = $('.kapp-progressbar-fill', row);
    const bar = $('.kapp-progressbar', row);
    const status = $('.kapp-upload-status', row);
    const pct = Math.round(frac * 100);
    if (fill) fill.style.width = pct + '%';
    if (bar) bar.setAttribute('aria-valuenow', String(pct));
    if (status) {
      status.textContent = statusText;
      status.classList.toggle('is-done', statusClass === 'done');
      status.classList.toggle('is-error', statusClass === 'error');
    }
  }

  function setUploadOverall(text) {
    const el = $('#uploadOverall');
    if (el) el.textContent = text;
  }

  function showDone() {
    setPhase('Done');
    const idEl = $('#doneAppId');
    if (idEl) idEl.textContent = submission ? submission.applicationId : '';
    const stepsEl = $('#doneNextSteps');
    if (stepsEl) stepsEl.innerHTML = t.nextSteps.map((s) => '<li>' + escapeHtml(s) + '</li>').join('');
    submitPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showErrorPhase(message, actions) {
    setPhase('Error');
    const el = $('#errorMsg');
    if (el) el.textContent = message;
    const btnWrap = $('#errorActions');
    if (btnWrap) {
      btnWrap.innerHTML = '';
      (actions || [{ label: t.backToForm, onClick: () => backToForm() }]).forEach((a) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'kapp-btn kapp-btn-primary';
        b.textContent = a.label;
        b.addEventListener('click', a.onClick);
        btnWrap.appendChild(b);
      });
    }
  }

  function handleGasError(res) {
    if (res && res.code === 'closed') {
      // preview=1 로컬 검수 중에는 폼을 닫지 않고 오류만 표시
      if (!isPreviewMode()) applyWindowState('closed');
      showErrorPhase(t.srvClosed);
      return;
    }
    if (res && res.code === 'invalid' && res.errors) {
      const msgs = [];
      Object.keys(res.errors).forEach((field) => {
        msgs.push(srvFieldMessage(field, res.errors[field]));
      });
      backToForm(t.srvInvalid + ' ' + msgs.join(' / '));
      return;
    }
    const map = {
      tooFast: t.srvTooFast,
      token: t.srvToken,
      notFound: t.srvNotFound,
      grace: t.srvGrace,
      server: t.srvServer,
    };
    showErrorPhase((res && map[res.code]) || t.srvServer);
  }

  function srvFieldMessage(field, code) {
    const E = t;
    const fileKind = field.indexOf('file_') === 0 ? field.slice(5) : '';
    const rule = fileKind && FILE_RULES[fileKind] ? FILE_RULES[fileKind] : null;
    const l = rule ? labelOfFile(fileKind) : labelOf(field);
    switch (code) {
      case 'required': return E.errRequired(l);
      case 'invalid': return E.errSelect(l);
      case 'range': return E.errDateRange;
      case 'rangeShort': return E.errDateRangeShort;
      case 'shareShortOnly': return E.errShareShortOnly;
      case 'minThree': return E.errMonthlyMin;
      case 'type': return E.errFileType(l, rule ? rule.typeLabel : 'PDF / Word');
      case 'size': return E.errFileSize(l, rule ? Math.round(rule.maxBytes / 1048576) : 10, '');
      case 'empty': return E.errFileType(l, rule ? rule.typeLabel : 'PDF / Word');
      default: return l + ': ' + code;
    }
  }

  if (btnSubmit) btnSubmit.addEventListener('click', runSubmission);

  /* ============================================================
   * Misc
   * ============================================================ */
  function escapeHtml(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // 입력 시 하이라이트 제거 + 임시저장
  form.addEventListener('input', (ev) => {
    if (ev.target && ev.target.setAttribute && ev.target.getAttribute('aria-invalid') === 'true') {
      ev.target.removeAttribute('aria-invalid');
    }
    scheduleDraftSave();
  });
  form.addEventListener('change', scheduleDraftSave);

  // 미제출 이탈 경고
  window.addEventListener('beforeunload', (ev) => {
    if (submissionFinished || maxStepReached === 1) return;
    const draft = serializeForm();
    const hasData = Object.keys(draft).some((k) => typeof draft[k] === 'string' && draft[k].trim() !== '');
    if (hasData) {
      saveDraft();
      ev.preventDefault();
      ev.returnValue = t.leaveWarning;
    }
  });

  // 한국어/중국어 면접 언어 선택 시 보조 안내
  $$('input[name="interviewLang"]').forEach((el) => el.addEventListener('change', () => {
    const note = $('#interviewLangNote');
    if (note) note.hidden = !(el.checked && (el.value === 'ko' || el.value === 'zh'));
  }));

  /* ============================================================
   * Init
   * ============================================================ */
  applyWindowState(clientWindowState());
  setInterval(() => { if (windowState === 'open') renderStatusBadge('open'); }, 60000);
  // preview=1 ではサーバー側の期間チェックでフォームを閉じない
  if (!isPreviewMode()) checkServerStatus();
  if (isPreviewMode()) {
    const badge = $('#statusBadge');
    if (badge) {
      badge.classList.add('is-open');
      badge.textContent = LANG === 'ja'
        ? 'プレビューモード（受付期間外でもフォーム表示）'
        : 'Preview mode (form shown outside application period)';
    }
    // 言語切替リンクでも preview クエリを維持
    $$('.kapp-lang-switch a[href]').forEach((a) => {
      try {
        const u = new URL(a.getAttribute('href'), location.href);
        u.searchParams.set('preview', '1');
        a.setAttribute('href', u.pathname.split('/').pop() + u.search + u.hash);
      } catch (e) { /* noop */ }
    });
  }

  refreshConditionals();
  renderMonthlyPlan();
  goToStep(1, false);
  restoreDraftPrompt();
  restoreSubmissionPrompt();
})();
