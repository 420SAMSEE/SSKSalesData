
const CONFIG = {
  URL: 'https://script.google.com/macros/s/AKfycbxF-kxAJQDlE9e78PXlCvaaJmhybA-lhbUlGr0dDG2ElkMFoYWos8fZSV-moJimv4nVrw/exec',
  PRICE: 40
};

document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'history') loadHistory();
      if (btn.dataset.tab === 'report') drawChart();
    });
  });

  document.getElementById('salesForm').addEventListener('submit', async e => {
    e.preventDefault();
    const data = {
      date: document.getElementById('date').value,
      quantity: +document.getElementById('quantity').value || 0,
      rawWaterDebt: +document.getElementById('rawWaterDebt').value || 0,
      debtCleared: +document.getElementById('debtCleared').value || 0,
      pipeCost: +document.getElementById('pipeCost').value || 0,
      shareCost: +document.getElementById('shareCost').value || 0,
      savings: +document.getElementById('savings').value || 0,
      otherExpenses: +document.getElementById('otherExpenses').value || 0,
    };
    data.totalIncome = (data.quantity + data.debtCleared) * CONFIG.PRICE;
    data.totalExpenses = data.pipeCost + data.shareCost + data.savings + data.otherExpenses;
    data.remaining = data.totalIncome - data.totalExpenses;
    try {
      const res = await fetch(CONFIG.URL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {'Content-Type': 'application/json'}
      });
      const result = await res.json();
      document.getElementById('status').innerText = result.success ? '✅ บันทึกสำเร็จ' : '❌ เกิดข้อผิดพลาด';
    } catch (err) {
      document.getElementById('status').innerText = '⚠️ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์';
    }
  });
});

async function loadHistory() {
  const res = await fetch(CONFIG.URL + '?method=GET');
  const data = await res.json();
  const tbody = document.querySelector('#historyTable tbody');
  tbody.innerHTML = '';
  data.data.slice().reverse().forEach(r => {
    const row = `<tr>
      <td>${r.date}</td><td>${r.quantity}</td>
      <td>${r.totalIncome}</td><td>${r.totalExpenses}</td><td>${r.remaining}</td>
    </tr>`;
    tbody.innerHTML += row;
  });
}

async function drawChart() {
  const res = await fetch(CONFIG.URL + '?method=GET');
  const data = await res.json();
  const labels = data.data.map(r => r.date);
  const income = data.data.map(r => r.totalIncome);
  const expenses = data.data.map(r => r.totalExpenses);
  const ctx = document.getElementById('reportChart').getContext('2d');
  if (window.myChart) window.myChart.destroy();
  window.myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'รายรับ', data: income, backgroundColor: '#2ecc71' },
        { label: 'รายจ่าย', data: expenses, backgroundColor: '#e74c3c' }
      ]
    }
  });
}
