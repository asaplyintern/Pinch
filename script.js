const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const shortMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const defaultGoals = [
  {
    id: 1,
    name: 'Emergency cushion',
    reason: 'One unexpected expense without using a credit card.',
    current: 720,
    target: 1000,
    date: '2026-12-20',
    color: '#2f7182',
    symbol: '✦',
  },
  {
    id: 2,
    name: 'Spring break trip',
    reason: 'Pay for travel before the semester gets busy.',
    current: 400,
    target: 800,
    date: '2027-03-01',
    color: '#ed7a75',
    symbol: '↗',
  },
];

const defaultTransactions = [
  { id: 1, name: 'Paycheck', category: 'Income', amount: 2560, type: 'income', date: '2026-10-22' },
  { id: 2, name: 'Campus dining', category: 'Food', amount: 34.2, type: 'expense', date: '2026-10-22' },
  { id: 3, name: 'Textbook rental', category: 'School', amount: 128, type: 'expense', date: '2026-10-19' },
  { id: 4, name: 'October rent', category: 'Housing', amount: 420, type: 'expense', date: '2026-10-15' },
  { id: 5, name: 'Bus pass', category: 'Transport', amount: 48, type: 'expense', date: '2026-10-12' },
  { id: 6, name: 'Coffee shop', category: 'Food', amount: 12.6, type: 'expense', date: '2026-10-10' },
  { id: 7, name: 'Groceries', category: 'Food', amount: 72, type: 'expense', date: '2026-10-07' },
  { id: 8, name: 'Movie night', category: 'Fun', amount: 28, type: 'expense', date: '2026-10-04' },
];

const chartSets = {
  week: { title: 'This week', labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], values: [36, 58, 27, 74, 49, 93, 44] },
  month: { title: 'This month', labels: ['1', '5', '9', '13', '17', '21', '25', '29'], values: [32, 57, 45, 78, 61, 92, 54, 71] },
  semester: { title: 'This semester', labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec'], values: [72, 90, 64, 51, 38] },
};

const state = {
  balance: readNumber('pinch-demo-balance', 2846.2),
  safe: readNumber('pinch-demo-safe', 486.2),
  goals: readList('pinch-demo-goals', defaultGoals),
  transactions: readList('pinch-demo-transactions', defaultTransactions),
  privacy: false,
  transactionFilter: 'all',
  transactionSearch: '',
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readNumber(key, fallback) {
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  const value = Number(stored);
  return Number.isFinite(value) ? value : fallback;
}

function readList(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : clone(fallback);
  } catch {
    return clone(fallback);
  }
}

function saveState() {
  try {
    localStorage.setItem('pinch-demo-balance', String(state.balance));
    localStorage.setItem('pinch-demo-safe', String(state.safe));
    localStorage.setItem('pinch-demo-goals', JSON.stringify(state.goals));
    localStorage.setItem('pinch-demo-transactions', JSON.stringify(state.transactions));
  } catch {
    showToast('Changes are saved for this session only.');
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${dateString}T12:00:00`));
}

function totals() {
  const income = state.transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = state.transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
  const goalCurrent = state.goals.reduce((sum, goal) => sum + Number(goal.current), 0);
  const goalTarget = state.goals.reduce((sum, goal) => sum + Number(goal.target), 0);
  return { income, expenses, goalCurrent, goalTarget };
}

function refreshPrivacyValues() {
  document.querySelectorAll('.private-money').forEach((element) => {
    if (element.dataset.realValue && element.textContent === '••••••') element.textContent = element.dataset.realValue;
    element.dataset.realValue = element.textContent;
  });
}

function applyPrivacy() {
  document.querySelectorAll('.private-money').forEach((element) => {
    if (!element.dataset.realValue) element.dataset.realValue = element.textContent;
    element.textContent = state.privacy ? '••••••' : element.dataset.realValue;
    element.classList.toggle('is-private', state.privacy);
  });
  document.querySelectorAll('[data-privacy-toggle]').forEach((button) => {
    button.textContent = state.privacy ? 'Show balances' : 'Hide balances';
    button.setAttribute('aria-label', state.privacy ? 'Show balances' : 'Hide balances');
    button.setAttribute('aria-pressed', String(state.privacy));
  });
}

function renderSummary() {
  const summary = totals();
  const checkingBalance = state.balance - 1360;
  setText('total-balance', money.format(state.balance));
  setText('overview-checking', money.format(checkingBalance));
  setText('checking-current', money.format(checkingBalance));
  setText('checking-available', money.format(checkingBalance - 50));
  setText('safe-to-spend', money.format(Math.max(0, state.safe)));
  setText('goal-total', money.format(summary.goalCurrent));
  setText('month-spent', money.format(summary.expenses));
  refreshPrivacyValues();
  applyPrivacy();
}

function renderGoals() {
  const container = document.getElementById('goal-list');
  if (!container) return;
  const summary = totals();
  setText('goal-total', money.format(summary.goalCurrent));
  setText('goal-target-total', money.format(summary.goalTarget));
  setText('goal-overall-percent', `${summary.goalTarget ? Math.round((summary.goalCurrent / summary.goalTarget) * 100) : 0}%`);
  container.innerHTML = state.goals
    .map((goal) => {
      const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
      return `
        <article class="goal-detail-card" style="--goal-color:${goal.color}">
          <div class="goal-card-top"><span class="goal-icon" aria-hidden="true">${goal.symbol}</span><span class="smart-badge">SMART</span></div>
          <h2>${escapeHtml(goal.name)}</h2>
          <p>${escapeHtml(goal.reason)}</p>
          <div class="goal-progress" role="progressbar" aria-label="${escapeHtml(goal.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div>
          <div class="goal-detail-stats"><span><strong class="private-money">${shortMoney.format(goal.current)}</strong> of <span class="private-money">${shortMoney.format(goal.target)}</span></span><span>${percent}% · ${formatDate(goal.date)}</span></div>
        </article>`;
    })
    .join('');
  refreshPrivacyValues();
  applyPrivacy();
}

function renderChart(period = 'month') {
  const chart = document.getElementById('spending-chart');
  const labels = document.getElementById('chart-labels');
  if (!chart || !labels) return;
  const data = chartSets[period] || chartSets.month;
  const max = Math.max(...data.values);
  setText('spending-title', data.title);
  setText('spending-amount', period === 'month' ? money.format(totals().expenses) : period === 'week' ? money.format(186.4) : money.format(3284.6));
  chart.innerHTML = data.values.map((value, index) => {
    const height = Math.max(6, Math.round((value / max) * 145));
    return `<button class="chart-bar${value === max ? ' is-highlighted' : ''}" type="button" style="height:${height}px; animation-delay:${index * 40}ms" data-value="$${value}" aria-label="${data.labels[index]}: $${value}"></button>`;
  }).join('');
  labels.innerHTML = data.labels.map((label) => `<span>${escapeHtml(label)}</span>`).join('');
  refreshPrivacyValues();
  applyPrivacy();
}

function renderTransactions() {
  const list = document.getElementById('transaction-list');
  if (!list) return;
  const query = state.transactionSearch.toLowerCase();
  const filtered = state.transactions
    .filter((item) => state.transactionFilter === 'all' || item.type === state.transactionFilter)
    .filter((item) => !query || item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  list.innerHTML = filtered.map((item) => {
    const income = item.type === 'income';
    return `
      <div class="transaction-row">
        <span class="transaction-icon ${income ? '' : 'expense'}" aria-hidden="true">${income ? '↗' : '↘'}</span>
        <span class="transaction-copy"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.category)} · ${formatDate(item.date)}</span></span>
        <strong class="transaction-amount private-money ${income ? 'income' : ''}">${income ? '+' : '−'}${money.format(item.amount)}</strong>
      </div>`;
  }).join('');
  document.getElementById('transaction-empty').hidden = filtered.length > 0;

  const summary = totals();
  setText('money-in', money.format(summary.income));
  setText('money-out', money.format(summary.expenses));
  setText('money-net', `${summary.income - summary.expenses >= 0 ? '+' : '−'}${money.format(Math.abs(summary.income - summary.expenses))}`);
  refreshPrivacyValues();
  applyPrivacy();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 2500);
}

function openModal(id, selector) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.showModal();
  setTimeout(() => modal.querySelector(selector)?.focus(), 0);
}

function closeModal(modal) {
  if (modal?.open) modal.close();
}

function setTransactionType(type) {
  const input = document.getElementById('transaction-type');
  if (!input) return;
  input.value = type;
  document.querySelectorAll('[data-transaction-type]').forEach((button) => button.classList.toggle('is-active', button.dataset.transactionType === type));
  const category = document.getElementById('transaction-category');
  if (type === 'income') category.value = 'Income';
  if (type === 'expense' && category.value === 'Income') category.value = 'Food';
}

function saveTransaction(event) {
  event.preventDefault();
  const type = document.getElementById('transaction-type').value;
  const amount = Number(document.getElementById('transaction-amount').value);
  const name = document.getElementById('transaction-description').value.trim();
  const category = document.getElementById('transaction-category').value;
  const date = document.getElementById('transaction-date').value;
  if (!amount || !name || !date) return;

  state.transactions.push({ id: Date.now(), type, amount, name, category, date });
  state.balance += type === 'income' ? amount : -amount;
  state.safe += type === 'income' ? amount : -amount;
  saveState();
  event.currentTarget.reset();
  setTransactionType('expense');
  closeModal(document.getElementById('transaction-modal'));
  renderSummary();
  renderTransactions();
  renderChart(document.getElementById('spending-period')?.value || 'month');
  showToast('Transaction saved.');
}

function saveGoal(event) {
  event.preventDefault();
  const name = document.getElementById('goal-name').value.trim();
  const target = Number(document.getElementById('goal-target').value);
  const date = document.getElementById('goal-date').value;
  const reason = document.getElementById('goal-reason').value.trim();
  if (!name || !target || !date || !reason) return;
  const colors = ['#2f7182', '#ed7a75', '#63a8d5', '#c77b4d'];
  state.goals.unshift({ id: Date.now(), name, target, current: 0, date, reason, color: colors[state.goals.length % colors.length], symbol: '◎' });
  saveState();
  event.currentTarget.reset();
  closeModal(document.getElementById('goal-modal'));
  renderGoals();
  showToast('Goal created.');
}

function initialize() {
  if (document.getElementById('today-label')) {
    setText('today-label', new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()));
  }

  document.querySelectorAll('[data-privacy-toggle]').forEach((button) => {
    button.addEventListener('click', () => { state.privacy = !state.privacy; applyPrivacy(); });
  });
  document.querySelectorAll('[data-open-transaction]').forEach((button) => {
    button.addEventListener('click', () => {
      document.getElementById('transaction-date').value = new Date().toISOString().slice(0, 10);
      openModal('transaction-modal', '#transaction-amount');
    });
  });
  document.querySelectorAll('[data-open-goal]').forEach((button) => button.addEventListener('click', () => openModal('goal-modal', '#goal-name')));
  document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => closeModal(button.closest('dialog'))));
  document.querySelectorAll('.modal').forEach((modal) => modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(modal); }));
  document.querySelectorAll('[data-transaction-type]').forEach((button) => button.addEventListener('click', () => setTransactionType(button.dataset.transactionType)));
  document.getElementById('transaction-form')?.addEventListener('submit', saveTransaction);
  document.getElementById('goal-form')?.addEventListener('submit', saveGoal);
  document.getElementById('spending-period')?.addEventListener('change', (event) => renderChart(event.target.value));
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    state.transactionFilter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('is-active', item === button));
    renderTransactions();
  }));
  document.getElementById('transaction-search')?.addEventListener('input', (event) => { state.transactionSearch = event.target.value.trim(); renderTransactions(); });
  ['connect-account', 'connect-account-desktop'].forEach((id) => document.getElementById(id)?.addEventListener('click', () => showToast('Secure account connection is coming next.')));
  document.querySelectorAll('.detail-account > button').forEach((button) => button.addEventListener('click', () => showToast('Account details are ready for the next build.')));

  renderSummary();
  renderGoals();
  renderChart('month');
  renderTransactions();
}

function revealOverview() {
  const loader = document.getElementById('loader');
  const app = document.getElementById('app');
  if (!loader || !app) return;
  loader.classList.add('is-hidden');
  app.classList.add('is-ready');
  app.setAttribute('aria-hidden', 'false');
}

initialize();

if (document.getElementById('loader')) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen = sessionStorage.getItem('pinch-loader-seen');
  window.addEventListener('load', () => {
    setTimeout(revealOverview, reduced || seen ? 50 : 1000);
    sessionStorage.setItem('pinch-loader-seen', 'true');
  });
  setTimeout(revealOverview, reduced || seen ? 250 : 2200);
}
