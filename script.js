   <scripts>
    // Configuration
    const CONFIG = {
        GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzX3oxXgrDhSU3cRhsk8UJ7-uI-MZ2azRjYiUfBLHKURCFf1cdPeMvsnze-2d4CftQ/exec',
        PRICE_PER_BOTTLE: 40,
        DEFAULT_SHARE_COST: 100,
        DEFAULT_SAVINGS: 500,
        RECORDS_PER_PAGE: 10
    };

    // Main Application Class
    class SSKratomSystem {
        constructor() {
            this.currentPage = 1;
            this.allHistoryData = [];
            
            this.initElements();
            this.setupEventListeners();
            this.initializeForm();
            
            if (document.querySelector('.tab.active').dataset.tab === 'history') {
                this.loadHistory();
            }
        }

        initElements() {
            // Form elements
            this.salesForm = document.getElementById('salesForm');
            this.dateInput = document.getElementById('date');
            this.quantityInput = document.getElementById('quantity');
            this.rawWaterDebtInput = document.getElementById('rawWaterDebt');
            this.debtClearedInput = document.getElementById('debtCleared');
            this.totalIncomeInput = document.getElementById('totalIncome');
            this.pipeCostInput = document.getElementById('pipeCost');
            this.shareCostInput = document.getElementById('shareCost');
            this.savingsInput = document.getElementById('savings');
            this.otherExpensesInput = document.getElementById('otherExpenses');
            this.totalExpensesInput = document.getElementById('totalExpenses');
            this.remainingInput = document.getElementById('remaining');
            
            // Summary elements
            this.summaryIncome = document.getElementById('summaryIncome');
            this.summaryExpenses = document.getElementById('summaryExpenses');
            this.summaryRemaining = document.getElementById('summaryRemaining');
            
            // History elements
            this.historyTableBody = document.getElementById('historyTableBody');
            this.pagination = document.getElementById('pagination');
            
            // Modal elements
            this.previewModal = document.getElementById('previewModal');
            this.detailModal = document.getElementById('detailModal');
            this.modalPreviewContent = document.getElementById('modalPreviewContent');
            this.detailModalContent = document.getElementById('detailModalContent');
            
            // Status message
            this.statusMessage = document.getElementById('statusMessage');
        }

        setupEventListeners() {
            // Auto-calculating inputs
            const inputs = [
                'quantity', 'rawWaterDebt', 'debtCleared', 
                'pipeCost', 'shareCost', 'savings', 'otherExpenses'
            ];
            
            inputs.forEach(id => {
                document.getElementById(id).addEventListener('input', () => this.calculateRemaining());
            });

            // Tab switching
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', () => this.switchTab(tab));
            });

            // Buttons
            document.getElementById('previewBtn').addEventListener('click', () => this.showPreview());
            document.getElementById('confirmSaveBtn').addEventListener('click', () => this.confirmSave());
            document.getElementById('cancelSaveBtn').addEventListener('click', () => this.closeModal(this.previewModal));
            document.getElementById('refreshHistory').addEventListener('click', () => this.loadHistory());
            document.getElementById('exportData').addEventListener('click', () => this.exportData());

            // Close modals
            document.querySelectorAll('.close').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.modal').forEach(modal => {
                        this.closeModal(modal);
                    });
                });
            });

            // Click outside modal to close
            window.addEventListener('click', (event) => {
                if (event.target.classList.contains('modal')) {
                    this.closeModal(event.target);
                }
            });
        }

        initializeForm() {
            // Set default date to today
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            this.dateInput.value = formattedDate;
            
            // Set default values
            this.shareCostInput.value = CONFIG.DEFAULT_SHARE_COST;
            this.savingsInput.value = CONFIG.DEFAULT_SAVINGS;
            
            // Initial calculation
            this.calculateRemaining();
        }

        // ======================
        // Calculation Functions
        // ======================
        calculateIncome() {
            const quantity = parseFloat(this.quantityInput.value) || 0;
            const debtCleared = parseFloat(this.debtClearedInput.value) || 0;
            const totalIncome = (quantity + debtCleared) * CONFIG.PRICE_PER_BOTTLE;
            
            this.totalIncomeInput.value = this.formatNumber(totalIncome);
            this.summaryIncome.textContent = this.formatNumber(totalIncome) + ' ฿';
            return totalIncome;
        }

        calculateExpenses() {
            const pipeCost = parseFloat(this.pipeCostInput.value) || 0;
            const shareCost = parseFloat(this.shareCostInput.value) || 0;
            const savings = parseFloat(this.savingsInput.value) || 0;
            const otherExpenses = parseFloat(this.otherExpensesInput.value) || 0;
            const totalExpenses = pipeCost + shareCost + savings + otherExpenses;
            
            this.totalExpensesInput.value = this.formatNumber(totalExpenses);
            this.summaryExpenses.textContent = this.formatNumber(totalExpenses) + ' ฿';
            return totalExpenses;
        }

        calculateRemaining() {
            const totalIncome = this.calculateIncome();
            const totalExpenses = this.calculateExpenses();
            const remaining = totalIncome - totalExpenses;
            
            this.remainingInput.value = this.formatNumber(remaining);
            this.summaryRemaining.textContent = this.formatNumber(remaining) + ' ฿';
            return remaining;
        }

        // ======================
        // Form Handling Functions
        // ======================
        getFormData() {
            return {
                date: this.dateInput.value,
                quantity: parseFloat(this.quantityInput.value) || 0,
                rawWaterDebt: parseFloat(this.rawWaterDebtInput.value) || 0,
                debtCleared: parseFloat(this.debtClearedInput.value) || 0,
                pipeCost: parseFloat(this.pipeCostInput.value) || 0,
                shareCost: parseFloat(this.shareCostInput.value) || 0,
                savings: parseFloat(this.savingsInput.value) || 0,
                otherExpenses: parseFloat(this.otherExpensesInput.value) || 0,
                totalIncome: (parseFloat(this.quantityInput.value || 0) + parseFloat(this.debtClearedInput.value || 0)) * CONFIG.PRICE_PER_BOTTLE,
                totalExpenses: (parseFloat(this.pipeCostInput.value || 0) + 
                              parseFloat(this.shareCostInput.value || 0) + 
                              parseFloat(this.savingsInput.value || 0) + 
                              parseFloat(this.otherExpensesInput.value || 0)),
                remaining: ((parseFloat(this.quantityInput.value || 0) + parseFloat(this.debtClearedInput.value || 0)) * CONFIG.PRICE_PER_BOTTLE) - 
                          (parseFloat(this.pipeCostInput.value || 0) + 
                           parseFloat(this.shareCostInput.value || 0) + 
                           parseFloat(this.savingsInput.value || 0) + 
                           parseFloat(this.otherExpensesInput.value || 0))
            };
        }

        validateForm() {
            if (!this.dateInput.value) {
                this.showStatus('กรุณาเลือกวันที่', 'error');
                return false;
            }
            
            const quantity = parseFloat(this.quantityInput.value) || 0;
            if (quantity <= 0) {
                this.showStatus('กรุณากรอกจำนวนขวดที่ขายได้ (ต้องมากกว่า 0)', 'error');
                return false;
            }
            
            return true;
        }

        resetForm() {
            this.salesForm.reset();
            this.initializeForm();
        }

        // ======================
        // Modal Functions
        // ======================
        showPreview() {
            if (!this.validateForm()) return;
            
            this.updateModalPreview();
            this.openModal(this.previewModal);
        }

        updateModalPreview() {
            const formData = this.getFormData();
            
            const previewHTML = `
                <div class="summary-item">
                    <span><i class="far fa-calendar-alt"></i> วันที่:</span>
                    <span>${formData.date}</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-bottle-water"></i> จำนวนขวดที่ขายได้:</span>
                    <span>${formData.quantity} ขวด</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-exclamation-circle"></i> ค้างน้ำดิบ:</span>
                    <span>${formData.rawWaterDebt} ขวด</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-check-circle"></i> เคลียยอดค้างน้ำดิบ:</span>
                    <span>${formData.debtCleared} ขวด</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-coins"></i> รวมรายรับ:</span>
                    <span>${this.formatNumber(formData.totalIncome)} ฿</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-leaf"></i> ค่าท่อม:</span>
                    <span>${this.formatNumber(formData.pipeCost)} ฿</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-handshake"></i> ค่าแชร์:</span>
                    <span>${this.formatNumber(formData.shareCost)} ฿</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-piggy-bank"></i> เก็บออม:</span>
                    <span>${this.formatNumber(formData.savings)} ฿</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-receipt"></i> ค่าใช้จ่ายอื่น:</span>
                    <span>${this.formatNumber(formData.otherExpenses)} ฿</span>
                </div>
                <div class="summary-item summary-total">
                    <span><i class="fas fa-money-bill-wave"></i> รวมรายจ่าย:</span>
                    <span>${this.formatNumber(formData.totalExpenses)} ฿</span>
                </div>
                <div class="summary-item summary-total">
                    <span><i class="fas fa-wallet"></i> คงเหลือ:</span>
                    <span>${this.formatNumber(formData.remaining)} ฿</span>
                </div>
            `;
            
            this.modalPreviewContent.innerHTML = previewHTML;
        }

        openModal(modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        closeModal(modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        // ======================
        // Data Saving Functions
        // ======================
        async confirmSave() {
            this.closeModal(this.previewModal);
            await this.submitFormData();
        }

        async submitFormData() {
            const submitBtn = document.getElementById('confirmSaveBtn');
            const originalButtonText = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';

            try {
                const formData = this.getFormData();
                
                const response = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(formData),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    this.showStatus('บันทึกข้อมูลสำเร็จ!', 'success');
                    this.resetForm();
                    this.loadHistory();
                } else {
                    throw new Error(data.message || 'Unknown error');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showStatus('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalButtonText;
            }
        }

        // ======================
        // History Functions
        // ======================
        async loadHistory() {
            this.historyTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><div class="spinner"></div>กำลังโหลดข้อมูล...</td></tr>';
            
            try {
                const response = await fetch(`${CONFIG.GOOGLE_APPS_SCRIPT_URL}?method=GET`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (result.success && result.data && result.data.length > 0) {
                    this.allHistoryData = result.data;
                    this.allHistoryData.sort((a, b) => new Date(b.date) - new Date(a.date));
                    this.currentPage = 1;
                    this.displayHistoryPage();
                    this.showStatus('โหลดข้อมูลประวัติสำเร็จ', 'success');
                } else {
                    this.allHistoryData = [];
                    this.historyTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">ไม่พบข้อมูล</td></tr>';
                    this.showStatus('ไม่พบข้อมูลประวัติการบันทึก', 'info');
                }
            } catch (error) {
                console.error('Error loading history:', error);
                this.historyTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger-color);">เกิดข้อผิดพลาดในการโหลดประวัติ: ${error.message}</td></tr>`;
                this.showStatus('เกิดข้อผิดพลาดในการโหลดประวัติ: ' + error.message, 'error');
            }
        }

        displayHistoryPage() {
            this.historyTableBody.innerHTML = '';
            
            const startIndex = (this.currentPage - 1) * CONFIG.RECORDS_PER_PAGE;
            const endIndex = Math.min(startIndex + CONFIG.RECORDS_PER_PAGE, this.allHistoryData.length);
            
            if (this.allHistoryData.length === 0) {
                this.historyTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">ไม่พบข้อมูล</td></tr>';
                return;
            }
            
            for (let i = startIndex; i < endIndex; i++) {
                const item = this.allHistoryData[i];
                const row = document.createElement('tr');
                row.dataset.id = item.id; 
                row.innerHTML = `
                    <td>${item.date}</td>
                    <td>${item.quantity || 0} ขวด<br><small>เคลียร์ยอด: ${item.debtCleared || 0} ขวด</small></td>
                    <td>${this.formatNumber(item.totalIncome || 0)} ฿</td>
                    <td>${this.formatNumber(item.totalExpenses || 0)} ฿</td>
                    <td>${this.formatNumber(item.remaining || 0)} ฿</td>
                    <td><span class="badge badge-success"><i class="fas fa-check-circle"></i> บันทึกแล้ว</span></td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 12px;" onclick="app.showDetail('${item.id}')">
                            <i class="fas fa-info-circle"></i> รายละเอียด
                        </button>
                    </td>
                `;
                this.historyTableBody.appendChild(row);
            }
            
            this.setupPagination();
        }

        setupPagination() {
            this.pagination.innerHTML = '';
            
            const totalPages = Math.ceil(this.allHistoryData.length / CONFIG.RECORDS_PER_PAGE);
            
            if (totalPages <= 1) return;
            
            // Previous Button
            const prevLi = document.createElement('li');
            prevLi.className = 'page-item';
            prevLi.innerHTML = `<a class="page-link" href="#" id="prevPage"><i class="fas fa-chevron-left"></i></a>`;
            this.pagination.appendChild(prevLi);
            
            // Page Numbers
            for (let i = 1; i <= totalPages; i++) {
                const li = document.createElement('li');
                li.className = 'page-item';
                li.innerHTML = `<a class="page-link ${i === this.currentPage ? 'active' : ''}" href="#" data-page="${i}">${i}</a>`;
                this.pagination.appendChild(li);
            }
            
            // Next Button
            const nextLi = document.createElement('li');
            nextLi.className = 'page-item';
            nextLi.innerHTML = `<a class="page-link" href="#" id="nextPage"><i class="fas fa-chevron-right"></i></a>`;
            this.pagination.appendChild(nextLi);
            
            // Event Listeners
            document.querySelectorAll('.page-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    if (e.currentTarget.id === 'prevPage' && this.currentPage > 1) {
                        this.currentPage--;
                    } else if (e.currentTarget.id === 'nextPage' && this.currentPage < totalPages) {
                        this.currentPage++;
                    } else if (e.currentTarget.dataset.page) {
                        this.currentPage = parseInt(e.currentTarget.dataset.page);
                    }
                    
                    this.displayHistoryPage();
                });
            });
        }

        // ======================
        // Detail View Functions
        // ======================
        async showDetail(id) {
            this.detailModalContent.innerHTML = '<div class="spinner"></div><div style="text-align: center; margin-top: 10px;">กำลังโหลดรายละเอียด...</div>';
            
            this.openModal(this.detailModal);
            
            const detailData = this.allHistoryData.find(item => item.id === id);

            if (!detailData) {
                this.detailModalContent.innerHTML = `
                    <div class="error" style="padding: 15px; border-radius: 8px;">
                        <i class="fas fa-exclamation-triangle"></i> ไม่พบรายละเอียดสำหรับรายการนี้
                    </div>
                `;
                return;
            }
            
            this.detailModalContent.innerHTML = `
                <div class="summary-item">
                    <span><i class="far fa-calendar-alt"></i> วันที่:</span>
                    <span>${detailData.date || 'N/A'}</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-bottle-water"></i> จำนวนขวดที่ขายได้:</span>
                    <span>${detailData.quantity || 0} ขวด</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-exclamation-circle"></i> ค้างน้ำดิบ:</span>
                    <span>${detailData.rawWaterDebt || 0} ขวด</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-check-circle"></i> เคลียยอดค้างน้ำดิบ:</span>
                    <span>${detailData.debtCleared || 0} ขวด</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-coins"></i> รวมรายรับ:</span>
                    <span>${this.formatNumber(detailData.totalIncome || 0)} ฿</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-leaf"></i> ค่าท่อม:</span>
                    <span>${this.formatNumber(detailData.pipeCost || 0)} ฿</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-handshake"></i> ค่าแชร์:</span>
                    <span>${this.formatNumber(detailData.shareCost || 0)} ฿</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-piggy-bank"></i> เก็บออม:</span>
                    <span>${this.formatNumber(detailData.savings || 0)} ฿</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-receipt"></i> ค่าใช้จ่ายอื่น:</span>
                    <span>${this.formatNumber(detailData.otherExpenses || 0)} ฿</span>
                </div>
                <div class="summary-item summary-total">
                    <span><i class="fas fa-money-bill-wave"></i> รวมรายจ่าย:</span>
                    <span>${this.formatNumber(detailData.totalExpenses || 0)} ฿</span>
                </div>
                <div class="summary-item summary-total">
                    <span><i class="fas fa-wallet"></i> คงเหลือ:</span>
                    <span>${this.formatNumber(detailData.remaining || 0)} ฿</span>
                </div>
            `;
        }

        // ======================
        // Data Export Functions
        // ======================
        exportData() {
            if (this.allHistoryData.length === 0) {
                this.showStatus('ไม่มีข้อมูลที่จะส่งออก', 'warning');
                return;
            }

            let csvContent = "data:text/csv;charset=utf-8,";
            
            // Header
            csvContent += "วันที่,จำนวนขวดที่ขายได้,ค้างน้ำดิบ,เคลียยอดค้างน้ำดิบ,รายรับ,ค่าท่อม,ค่าแชร์,เก็บออม,ค่าใช้จ่ายอื่น,รวมรายจ่าย,คงเหลือ\n";
            
            // Data
            this.allHistoryData.forEach(item => {
                const row = [
                    item.date,
                    item.quantity || 0,
                    item.rawWaterDebt || 0,
                    item.debtCleared || 0,
                    item.totalIncome || 0,
                    item.pipeCost || 0,
                    item.shareCost || 0,
                    item.savings || 0,
                    item.otherExpenses || 0,
                    item.totalExpenses || 0,
                    item.remaining || 0
                ].join(",");
                csvContent += row + "\n";
            });
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `SSKratomSystem_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showStatus('ส่งออกข้อมูลเรียบร้อยแล้ว', 'success');
        }

        // ======================
        // Utility Functions
        // ======================
        formatNumber(num) {
            if (typeof num !== 'number' || isNaN(num)) return '0.00';
            return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        showStatus(message, type) {
            this.statusMessage.textContent = message;
            this.statusMessage.className = type;
            this.statusMessage.style.display = 'block';

            setTimeout(() => {
                this.statusMessage.style.display = 'none';
            }, 5000);
        }

        switchTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
            
            if (tab.dataset.tab === 'history') {
                this.loadHistory();
            }
        }
    }

    // Initialize the application when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new SSKratomSystem();
    });

    </scripts>