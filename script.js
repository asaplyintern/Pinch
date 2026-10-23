const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const defaultGoals = [
  {
    id: 1,
    name: 'Emergency cushion',
    reason: 'Cover one unexpected expense without using a credit card.',
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

const chartSets = {
  week: {
    title: 'This week',
    amount: 186.4,
    comparison: '8% less than last week',
    labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    values: [36, 58, 27, 74, 49, 93, 44],
    aria: 'Daily spending for this week',
  },
  month: {
    title: 'This month',
    amount: 742.8,
    comparison: '12% less than last month',
    labels: ['1', '5', '9', '13', '17', '21', '25', '29'],
    values: [32, 57, 45, 78, 61, 92, 54, 71],
    aria: 'Spending across this month',
  },
  semester: {
    title: 'This semester',
    amount: 3284.6,
    comparison: '5% under your semester pace',
    labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    values: [72, 90, 64, 51, 38],
    aria: 'Monthly spending across this semester',
  },
};

const state = {
  balance: readNumber('pinch-demo-balance', 2846.2),
  safeToSpend: readNumber('pinch-demo-safe', 486.2),
  goals: readList('pinch-demo-goals', defaultGoals),
  amountsHidden: false,
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readNumber(key, fallback) {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
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
    localStorage.setItem('pinch-demo-safe', String(state.safeToSpend));
    localStorage.setItem('pinch-demo-goals', JSON.stringify(state.goals));
  } catch {
    showToast('Browser storage is unavailable, but your changes will remain for this session.');
  }
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
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function updateGreeting() {
  const now = new Date();
  const hour = now.getHours();
  setText('day-period', hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening');
  setText(
    'today-label',
    new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(now),
  );
}

function renderMoneySummary() {
  const goalTotal = state.goals.reduce((total, goal) => total + Number(goal.current), 0);
  setText('total-balance', currency.format(state.balance));
  setText('safe-to-spend', currency.format(Math.max(0, state.safeToSpend)));
  setText('goal-total', currency.format(goalTotal));
  refreshPrivacyValues();
  applyPrivacy();
}

function renderChart(period = 'month') {
  const data = chartSets[period] || chartSets.month;
  const chart = document.getElementById('spending-chart');
  const labels = document.getElementById('chart-labels');
  const max = Math.max(...data.values);

  setText('spending-title', data.title);
  setText('spending-amount', currency.format(data.amount));
  setText('spending-comparison', data.comparison);
  chart.setAttribute('aria-label', data.aria);
  chart.innerHTML = data.values
    .map((value, index) => {
      const height = Math.max(7, Math.round((value / max) * 96));
      const highlight = value === max ? ' is-highlighted' : '';
      return `<button class="chart-bar${highlight}" type="button" style="height:${height}px; animation-delay:${index * 45}ms" data-value="$${value}" aria-label="${data.labels[index]}: $${value}"></button>`;
    })
    .join('');
  labels.innerHTML = data.labels.map((label) => `<span>${escapeHtml(label)}</span>`).join('');
  refreshPrivacyValues();
  applyPrivacy();
}

function renderGoals() {
  const container = document.getElementById('goal-list');
  container.innerHTML = state.goals
    .slice(0, 4)
    .map((goal) => {
      const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
      return `
        <article class="goal-card" style="--goal-color:${goal.color}">
          <div class="goal-card-top">
            <span class="goal-symbol" aria-hidden="true">${goal.symbol}</span>
            <span class="smart-badge">SMART</span>
          </div>
          <h3>${escapeHtml(goal.name)}</h3>
          <p>${escapeHtml(goal.reason)}</p>
          <div class="goal-progress" role="progressbar" aria-label="${escapeHtml(goal.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}">
            <span style="width:${percent}%"></span>
          </div>
          <div class="goal-stats">
            <span><strong class="private-money">${compactCurrency.format(goal.current)}</strong> of <span class="private-money">${compactCurrency.format(goal.target)}</span></span>
            <span>${percent}% · ${formatDate(goal.date)}</span>
          </div>
        </article>`;
    })
    .join('');
  renderMoneySummary();
}

function refreshPrivacyValues() {
  document.querySelectorAll('.private-money').forEach((element) => {
    if (element.dataset.realValue && element.textContent === '••••••') {
      element.textContent = element.dataset.realValue;
    }
    element.dataset.realValue = element.textContent;
  });
}

function applyPrivacy() {
  document.querySelectorAll('.private-money').forEach((element) => {
    if (!element.dataset.realValue) element.dataset.realValue = element.textContent;
    element.textContent = state.amountsHidden ? '••••••' : element.dataset.realValue;
    element.classList.toggle('is-private', state.amountsHidden);
  });

  const button = document.getElementById('privacy-button');
  button.setAttribute('aria-pressed', String(state.amountsHidden));
  button.setAttribute('aria-label', state.amountsHidden ? 'Show money amounts' : 'Hide money amounts');
}

function openModal(id, focusSelector) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.showModal();
  window.setTimeout(() => modal.querySelector(focusSelector)?.focus(), 0);
}

function closeModal(modal) {
  if (modal?.open) modal.close();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

function setTransactionType(type) {
  setText('transaction-type', type);
  document.getElementById('transaction-type').value = type;
  document.querySelectorAll('[data-transaction-type]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.transactionType === type);
  });
  const category = document.getElementById('transaction-category');
  if (type === 'income') category.value = 'Income';
  if (type === 'expense' && category.value === 'Income') category.value = 'Food';
}

function saveTransaction(event) {
  event.preventDefault();
  const type = document.getElementById('transaction-type').value;
  const amount = Number(document.getElementById('transaction-amount').value);
  const description = document.getElementById('transaction-description').value.trim();
  const date = document.getElementById('transaction-date').value;

  if (!amount || !description || !date) return;

  const direction = type === 'income' ? 1 : -1;
  state.balance += amount * direction;
  state.safeToSpend += amount * direction;
  saveState();
  renderMoneySummary();

  event.currentTarget.reset();
  setTransactionType('expense');
  closeModal(document.getElementById('transaction-modal'));
  showToast(`${type === 'income' ? 'Income' : 'Expense'} saved. Your balance is current.`);
}

function saveGoal(event) {
  event.preventDefault();
  const name = document.getElementById('goal-name').value.trim();
  const target = Number(document.getElementById('goal-target').value);
  const date = document.getElementById('goal-date').value;
  const reason = document.getElementById('goal-reason').value.trim();

  if (!name || !target || !date || !reason) return;

  const colors = ['#2f7182', '#ed7a75', '#63a8d5', '#c77b4d'];
  state.goals.unshift({
    id: Date.now(),
    name,
    target,
    current: 0,
    date,
    reason,
    color: colors[state.goals.length % colors.length],
    symbol: '◎',
  });

  saveState();
  renderGoals();
  event.currentTarget.reset();
  closeModal(document.getElementById('goal-modal'));
  showToast('SMART goal created. You now have a clear target and deadline.');
}

function moveInsightToGoal() {
  const amount = 68;
  if (state.safeToSpend < amount) {
    showToast('There is not enough safe-to-spend money for that move yet.');
    return;
  }
  const emergencyGoal = state.goals.find((goal) => goal.name.toLowerCase().includes('emergency')) || state.goals[0];
  if (!emergencyGoal) return;
  emergencyGoal.current = Math.min(emergencyGoal.target, emergencyGoal.current + amount);
  state.safeToSpend -= amount;
  saveState();
  renderGoals();
  showToast(`$${amount} moved to ${emergencyGoal.name}.`);
}

function updateActiveNavigation(link) {
  const target = link.getAttribute('href');
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach((item) => {
    const active = item.getAttribute('href') === target;
    item.classList.toggle('is-active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
}

function initializeEvents() {
  document.querySelectorAll('[data-open-transaction]').forEach((button) => {
    button.addEventListener('click', () => {
      document.getElementById('transaction-date').value = new Date().toISOString().slice(0, 10);
      openModal('transaction-modal', '#transaction-amount');
    });
  });

  document.querySelectorAll('[data-open-goal]').forEach((button) => {
    button.addEventListener('click', () => openModal('goal-modal', '#goal-name'));
  });

  document.querySelectorAll('[data-close-modal]').forEach((button) => {
    button.addEventListener('click', () => closeModal(button.closest('dialog')));
  });

  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal(modal);
    });
  });

  document.querySelectorAll('[data-transaction-type]').forEach((button) => {
    button.addEventListener('click', () => setTransactionType(button.dataset.transactionType));
  });

  document.getElementById('transaction-form').addEventListener('submit', saveTransaction);
  document.getElementById('goal-form').addEventListener('submit', saveGoal);
  document.getElementById('spending-period').addEventListener('change', (event) => renderChart(event.target.value));

  document.getElementById('privacy-button').addEventListener('click', () => {
    state.amountsHidden = !state.amountsHidden;
    applyPrivacy();
  });

  document.getElementById('use-insight').addEventListener('click', moveInsightToGoal);
  document.getElementById('review-spending').addEventListener('click', () => {
    document.getElementById('activity').scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('Your spending pulse is open. Try the period selector.');
  });

  ['connect-account', 'manage-accounts'].forEach((id) => {
    document.getElementById(id).addEventListener('click', () => {
      showToast('Secure bank connection is planned for the next build.');
    });
  });

  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach((link) => {
    link.addEventListener('click', () => updateActiveNavigation(link));
  });
}

function revealApp() {
  const loader = document.getElementById('loader');
  const app = document.getElementById('app');
  loader.classList.add('is-hidden');
  app.classList.add('is-ready');
  app.setAttribute('aria-hidden', 'false');
}

updateGreeting();
renderChart('month');
renderGoals();
initializeEvents();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
window.addEventListener('load', () => {
  window.setTimeout(revealApp, reducedMotion ? 50 : 1450);
});

window.setTimeout(() => {
  if (!document.getElementById('app').classList.contains('is-ready')) revealApp();
}, reducedMotion ? 250 : 3000);
