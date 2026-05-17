
const STORAGE_KEY = 'ledger_transactions_v1';

let transactions = loadFromStorage();

function loadFromStorage () {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveToStorage () {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function generateId () {
  return `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function addTransaction(desc, amount, category) {
  const tx = {
    id: generateId(),
    desc: desc.trim(),
    amount: parseFloat(amount),
    category,
    date: new Date().toISOString()
  };
  transactions = [tx, ...transactions];
  saveToStorage();
  renderAll();
  showToast(`"${tx.desc}" added`);
}

function removeTransaction(id) {
  const item = document.querySelector(`[data-id="${id}"]`);
  if (item) {
    item.classList.add('removing');
    item.addEventListener('animationend', () => {
      transactions = transactions.filter(tx => tx.id !==id);
      saveToStorage();
      renderAll();
      showToast('Transaction removed');
  }, {once:true});
  }
}

function calcBalance () {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}

function calcIncome () {
  return transactions.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
}

function calcExpenses () {
  return Math.abs(transactions.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0));
}

function formatCurrency (n) {
  return `₹ ${Math.abs(n).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function formatDate(iso) {
  return dayjs(iso).format('D MMM YYYY · hh:mm A');
}

function renderSummary () {
  const balance = calcBalance();
  const income = calcIncome();
  const expenses = calcExpenses();

  const balEl = document.getElementById('balance');
  balEl.textContent = `${(balance < 0 ? '-' : '')} ${formatCurrency(balance)}`;
  balEl.className = `balance-amount ${balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'zero'}`;

  document.getElementById('total-income').textContent = `+ ${formatCurrency(income)}`;
  document.getElementById('total-expenses').textContent = `- ${formatCurrency(expenses)}`;
}

function renderTransactions() {
  const container = document.getElementById('tx-container');
  const countEl = document.getElementById('tx-count');

  countEl.textContent = transactions.length === 1 ? '1 entry' : `${transactions.length} entries`

  if (transactions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No transactions yet. <br> Add your first income or expense above. </p>
      </div>  
    `;
    return;
  }

  container.innerHTML = `
    <ul class="tx-list" role="list">
     ${transactions.map(renderTxItem).join('')}
    </ul> 
  `;

  container.querySelectorAll('.btn-delete').forEach((btn) =>{
    btn.addEventListener('click', () => {
      removeTransaction(btn.dataset.id)
    });
  });
}

function renderTxItem(tx) {
  const isIncome = tx.amount >= 0;
  const typeClass = isIncome ? 'income-item' : 'expense-item';
  const icon = isIncome ? '↑' : '↓';
  const sign = isIncome ? '+' : '-';
  const safeDesc = tx.desc.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeCat = tx.category.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `
   <li class="tx-item ${typeClass}" data-id="${tx.id}" role="listitem">
   <div class="tx-dot">${icon}</div>
   <div class="tx-info">
    <div class="tx-desc">${safeDesc}</div>
    <div class="tx-meta">
     <span class="tx-date">${formatDate(tx.date)}</span>
     <span class="tx-category">${safeCat}</span>
    </div>
   </div>
   <div class="tx-amount">${sign}${formatCurrency(tx.amount)}</div>
   <button class="btn-delete" data-id="${tx.id}" aria-label="Delete transaction">X</button>
   </li> 
  `;
}

function renderAll(){
  renderSummary();
  renderTransactions();
}

let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  },2200);
}

document.getElementById('btn-add').addEventListener('click', () => {
  const descEl = document.getElementById('desc');
  const amountEl = document.getElementById('amount');
  const catEl = document.getElementById('category');

  const desc = descEl.value.trim();
  const amount = amountEl.value.trim();
  const cat = catEl.value;

  if (!desc) {
    descEl.focus();
    showToast('⚠️ Please enter a description');
    return;
  }

  if (!amount || isNaN(Number(amount)) || Number(amount) === 0) {
    amountEl.focus();
    showToast('⚠️ Please enter a non-zero amount');
    return;
  }

  addTransaction(desc, amount, cat);

  descEl.value = '';
  amountEl.value = '';
  catEl.value = 'General';
  descEl.focus();
});

['desc', 'amount'].forEach((id) => {
  document.getElementById(id).addEventListener('keydown', (e) => {
    if (e.key === 'Enter'){
      document.getElementById('btn-add').click();
    }
  });
});

renderAll();