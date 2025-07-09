
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        // ตั้งค่า URL ของ Google Apps Script ที่คุณเผยแพร่แล้ว
        const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw-HlNq7lcRcp07pxTCJEu8rs_-y-Hmi0b_GWlS3BTFoHSdKEU1YMb2YRINI7SijrQh/exec';
        
        // ตัวแปรสำหรับ Chart
        let expensesChart = null;
        
        // ตั้งค่าตัวแปรสำหรับการแบ่งหน้า
        let currentPage = 1;
        const recordsPerPage = 10;
        let allHistoryData = [];
        let filteredHistoryData = [];
        
        // ตั้งค่าวันที่เริ่มต้นเป็นวันปัจจุบัน
        document.getElementById('date').valueAsDate = new Date();
        
        // ฟังก์ชันจัดรูปแบบตัวเลขด้วยเครื่องหมายคอมม่า
        function formatNumber(num) {
            if (typeof num !== 'number' || isNaN(num)) return '0.00';
            return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        
        // ฟังก์ชันคำนวณรายรับอัตโนมัติ
        function calculateIncome() {
            const quantity = parseFloat(document.getElementById('quantity').value) || 0;
            const rawWaterDebt = parseFloat(document.getElementById('rawWaterDebt').value) || 0;
            const pricePerUnit = 40; // ราคาต่อหน่วย 40 บาท
            
            const netUnits = Math.max(0, quantity - rawWaterDebt);
            const totalIncome = netUnits * pricePerUnit;
            
            document.getElementById('totalIncome').value = formatNumber(totalIncome);
            document.getElementById('summaryIncome').textContent = formatNumber(totalIncome) + ' ฿';
            return totalIncome;
        }
        
        // ฟังก์ชันคำนวณรายจ่าย
        function calculateExpenses() {
            const pipeCost = parseFloat(document.getElementById('pipeCost').value) || 0;
            const shareCost = parseFloat(document.getElementById('shareCost').value) || 0;
            const savings = parseFloat(document.getElementById('savings').value) || 0;
            const otherExpenses = parseFloat(document.getElementById('otherExpenses').value) || 0;
            const totalExpenses = pipeCost + shareCost + savings + otherExpenses;
            document.getElementById('totalExpenses').value = formatNumber(totalExpenses);
            document.getElementById('summaryExpenses').textContent = formatNumber(totalExpenses) + ' ฿';
            return totalExpenses;
        }
        
        // ฟังก์ชันคำนวณคงเหลือ
        function calculateRemaining() {
            const totalIncome = calculateIncome();
            const totalExpenses = calculateExpenses();
            const remaining = totalIncome - totalExpenses;
            
            document.getElementById('remaining').value = formatNumber(remaining);
            document.getElementById('summaryRemaining').textContent = formatNumber(remaining) + ' ฿';
            
            return remaining;
        }
        
        // ฟังก์ชันอัปเดตตัวอย่างข้อมูลสำหรับ Modal
        function updateModalPreview() {
            const previewElement = document.getElementById('modalPreviewContent');
            
            // ใช้ค่าจาก input โดยตรง และคำนวณใหม่เพื่อให้มั่นใจว่าได้ค่าล่าสุด
            const date = document.getElementById('date').value;
            const quantity = parseFloat(document.getElementById('quantity').value) || 0;
            const rawWaterDebt = parseFloat(document.getElementById('rawWaterDebt').value) || 0;
            const pipeCost = parseFloat(document.getElementById('pipeCost').value) || 0;
            const shareCost = parseFloat(document.getElementById('shareCost').value) || 0;
            const savings = parseFloat(document.getElementById('savings').value) || 0;
            const otherExpenses = parseFloat(document.getElementById('otherExpenses').value) || 0;

            const pricePerUnit = 40;
            const calculatedIncome = Math.max(0, quantity - rawWaterDebt) * pricePerUnit;
            const calculatedExpenses = pipeCost + shareCost + savings + otherExpenses;
            const calculatedRemaining = calculatedIncome - calculatedExpenses;

            let previewHTML = `
                <div class="summary-item">
                    <span><i class="far fa-calendar-alt"></i> วันที่:</span>
                    <span>${date}</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-bottle-water"></i> จำนวนขวดที่ขายได้:</span>
                    <span>${quantity} ขวด</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-exclamation-circle"></i> ค้างน้ำดิบ:</span>
                    <span>${rawWaterDebt} ขวด</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-coins"></i> รวมรายรับ:</span>
                    <span>${formatNumber(calculatedIncome)} ฿</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-leaf"></i> ค่าท่อม:</span>
                    <span>${formatNumber(pipeCost)} ฿</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-handshake"></i> ค่าแชร์:</span>
                    <span>${formatNumber(shareCost)} ฿</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-piggy-bank"></i> เก็บออม:</span>
                    <span>${formatNumber(savings)} ฿</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-receipt"></i> ค่าใช้จ่ายอื่น:</span>
                    <span>${formatNumber(otherExpenses)} ฿</span>
                </div>
                <div class="summary-item summary-total">
                    <span><i class="fas fa-money-bill-wave"></i> รวมรายจ่าย:</span>
                    <span>${formatNumber(calculatedExpenses)} ฿</span>
                </div>
                <div class="summary-item summary-total">
                    <span><i class="fas fa-wallet"></i> คงเหลือ:</span>
                    <span>${formatNumber(calculatedRemaining)} ฿</span>
                </div>
            `;
            
            previewElement.innerHTML = previewHTML;
        }
        
        // ฟังก์ชันดึงข้อมูลจากฟอร์มสำหรับส่งไปยัง Apps Script
        function getFormDataForSubmission() {
            const data = {
                date: document.getElementById('date').value,
                quantity: parseFloat(document.getElementById('quantity').value) || 0,
                rawWaterDebt: parseFloat(document.getElementById('rawWaterDebt').value) || 0,
                pipeCost: parseFloat(document.getElementById('pipeCost').value) || 0,
                shareCost: parseFloat(document.getElementById('shareCost').value) || 0,
                savings: parseFloat(document.getElementById('savings').value) || 0,
                otherExpenses: parseFloat(document.getElementById('otherExpenses').value) || 0,
            };

            // คำนวณค่าที่ส่งไปให้ Apps Script โดยตรง
            const pricePerUnit = 40;
            data.totalIncome = Math.max(0, data.quantity - data.rawWaterDebt) * pricePerUnit;
            data.totalExpenses = data.pipeCost + data.shareCost + data.savings + data.otherExpenses;
            data.remaining = data.totalIncome - data.totalExpenses;
            
            return data;
        }
        
        // ตั้ง Event Listeners สำหรับการคำนวณอัตโนมัติ
        const inputs = ['quantity', 'rawWaterDebt', 'pipeCost', 'shareCost', 'savings', 'otherExpenses'];
        inputs.forEach(id => {
            document.getElementById(id).addEventListener('input', calculateRemaining);
        });

        // Tab Switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                this.classList.add('active');
                document.getElementById(`${this.dataset.tab}-tab`).classList.add('active');
                
                if (this.dataset.tab === 'history') {
                    loadHistory();
                } else if (this.dataset.tab === 'reports') {
                    loadReports();
                }
            });
        });
        
        // Report Period Selector
        document.getElementById('reportPeriod').addEventListener('change', function() {
            const customDateRange = document.getElementById('customDateRange');
            if (this.value === 'custom') {
                customDateRange.style.display = 'block';
                
                // ตั้งค่าวันที่เริ่มต้นและสิ้นสุดเริ่มต้น
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - 30);
                
                document.getElementById('startDate').valueAsDate = startDate;
                document.getElementById('endDate').valueAsDate = endDate;
            } else {
                customDateRange.style.display = 'none';
                loadReports();
            }
        });
        
        // Custom Date Range Inputs
        document.getElementById('startDate').addEventListener('change', loadReports);
        document.getElementById('endDate').addEventListener('change', loadReports);
        
        // Preview Button (เปลี่ยนเป็น ตรวจสอบข้อมูลก่อนบันทึก)
        document.getElementById('previewBtn').addEventListener('click', function() {
            const quantity = parseFloat(document.getElementById('quantity').value) || 0;

            if (quantity <= 0) {
                showStatus('กรุณากรอกจำนวนขวดที่ขายได้ (ต้องมากกว่า 0) ก่อนตรวจสอบข้อมูล', 'error');
                return;
            }
            
            updateModalPreview(); // อัปเดตตัวอย่างใน modal
            document.getElementById('previewModal').style.display = 'flex'; // เปลี่ยนเป็น flex เพื่อจัดกลาง
        });
        
        // Clear Form Button
        document.getElementById('clearFormBtn').addEventListener('click', function() {
            document.getElementById('salesForm').reset();
            document.getElementById('date').valueAsDate = new Date();
            document.getElementById('shareCost').value = '100';
            document.getElementById('savings').value = '500';
            calculateRemaining();
            showStatus('ล้างฟอร์มเรียบร้อยแล้ว', 'success');
        });
        
        // Confirm Save Button
        document.getElementById('confirmSaveBtn').addEventListener('click', async function() {
            document.getElementById('previewModal').style.display = 'none';
            await submitFormData(); // เรียกใช้ฟังก์ชัน submit โดยตรง
        });

        // Cancel Save Button
        document.getElementById('cancelSaveBtn').addEventListener('click', function() {
            document.getElementById('previewModal').style.display = 'none';
        });

        // Close Modal Buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            });
        });
        
        // Click outside modal to close
        window.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });

        // Refresh History Button
        document.getElementById('refreshHistory').addEventListener('click', loadHistory);
        
        // Export Data Button
        document.getElementById('exportData').addEventListener('click', exportData);
        
        // Delete All Data Button
        document.getElementById('deleteAllData').addEventListener('click', function() {
            document.getElementById('confirmDeleteModal').style.display = 'flex';
        });
        
        // Confirm Delete Button
        document.getElementById('confirmDeleteBtn').addEventListener('click', deleteAllData);
        
        // Cancel Delete Button
        document.getElementById('cancelDeleteBtn').addEventListener('click', function() {
            document.getElementById('confirmDeleteModal').style.display = 'none';
        });
        
        // History Search
        document.getElementById('historySearch').addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            if (searchTerm === '') {
                filteredHistoryData = [...allHistoryData];
            } else {
                filteredHistoryData = allHistoryData.filter(item => 
                    item.date.toLowerCase().includes(searchTerm) ||
                    item.quantity.toString().includes(searchTerm) ||
                    item.totalIncome.toString().includes(searchTerm) ||
                    item.totalExpenses.toString().includes(searchTerm) ||
                    item.remaining.toString().includes(searchTerm)
                );
            }
            
            currentPage = 1;
            displayHistoryPage();
        });
        
        // Refresh Reports Button
        document.getElementById('refreshReports').addEventListener('click', loadReports);
        
        // Export Report Button
        document.getElementById('exportReport').addEventListener('click', exportReport);

        // ฟังก์ชันสร้าง Pagination
        function setupPagination(totalRecords) {
            const pagination = document.getElementById('pagination');
            pagination.innerHTML = '';
            
            const totalPages = Math.ceil(totalRecords / recordsPerPage);
            
            if (totalPages <= 1) return;
            
            // Previous Button
            const prevLi = document.createElement('li');
            prevLi.className = 'page-item';
            prevLi.innerHTML = `<a class="page-link" href="#" id="prevPage"><i class="fas fa-chevron-left"></i></a>`;
            pagination.appendChild(prevLi);
            
            // Page Numbers
            for (let i = 1; i <= totalPages; i++) {
                const li = document.createElement('li');
                li.className = 'page-item';
                li.innerHTML = `<a class="page-link ${i === currentPage ? 'active' : ''}" href="#" data-page="${i}">${i}</a>`;
                pagination.appendChild(li);
            }
            
            // Next Button
            const nextLi = document.createElement('li');
            nextLi.className = 'page-item';
            nextLi.innerHTML = `<a class="page-link" href="#" id="nextPage"><i class="fas fa-chevron-right"></i></a>`;
            pagination.appendChild(nextLi);
            
            // Event Listeners
            document.querySelectorAll('.page-link').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    if (this.id === 'prevPage' && currentPage > 1) {
                        currentPage--;
                    } else if (this.id === 'nextPage' && currentPage < totalPages) {
                        currentPage++;
                    } else if (this.dataset.page) {
                        currentPage = parseInt(this.dataset.page);
                    }
                    
                    displayHistoryPage();
                });
            });
        }

        // ฟังก์ชันแสดงข้อมูลแบ่งหน้า
        function displayHistoryPage() {
            const tbody = document.getElementById('historyTableBody');
            tbody.innerHTML = '';
            
            const dataToDisplay = filteredHistoryData.length > 0 ? filteredHistoryData : allHistoryData;
            const startIndex = (currentPage - 1) * recordsPerPage;
            const endIndex = Math.min(startIndex + recordsPerPage, dataToDisplay.length);
            
            if (dataToDisplay.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">ไม่พบข้อมูล</td></tr>';
                setupPagination(0);
                return;
            }
            
            for (let i = startIndex; i < endIndex; i++) {
                const item = dataToDisplay[i];
                const row = document.createElement('tr');
                row.dataset.id = item.id; 
                row.innerHTML = `
                    <td>${item.date}</td>
                    <td>${item.quantity || 0} ขวด</td>
                    <td>${formatNumber(item.totalIncome || 0)} ฿</td>
                    <td>${formatNumber(item.totalExpenses || 0)} ฿</td>
                    <td>${formatNumber(item.remaining || 0)} ฿</td>
                    <td><span class="badge badge-success"><i class="fas fa-check-circle"></i> บันทึกแล้ว</span></td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 12px;" onclick="showDetail('${item.id}')">
                            <i class="fas fa-info-circle"></i> รายละเอียด
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            }
            
            setupPagination(dataToDisplay.length);
        }

        // ฟังก์ชันโหลดประวัติ
        async function loadHistory() {
            if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
                showStatus('กรุณาตั้งค่า URL ของ Google Apps Script ก่อนใช้งาน', 'warning');
                const tbody = document.getElementById('historyTableBody');
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">**กรุณาตั้งค่า Google Apps Script URL ในโค้ด**</td></tr>';
                return;
            }

            const tbody = document.getElementById('historyTableBody');
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><div class="spinner"></div>กำลังโหลดข้อมูล...</td></tr>';
            
            try {
                // เพิ่ม timestamp เพื่อป้องกันการ cache
                const urlWithTimestamp = `${GOOGLE_APPS_SCRIPT_URL}?method=GET_HISTORY&timestamp=${new Date().getTime()}`;
                
                const response = await fetch(urlWithTimestamp);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.status === 'success' && data.data) {
                    allHistoryData = data.data;
                    filteredHistoryData = [...allHistoryData];
                    currentPage = 1;
                    displayHistoryPage();
                    showStatus('โหลดข้อมูลประวัติสำเร็จ', 'success');
                } else {
                    throw new Error(data.message || 'ไม่สามารถโหลดข้อมูลได้');
                }
                
            } catch (error) {
                console.error('Error loading history:', error);
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">ไม่สามารถโหลดข้อมูลได้: ' + error.message + '</td></tr>';
                showStatus('เกิดข้อผิดพลาดในการโหลดประวัติ: ' + error.message, 'error');
            }
        }
        
        // ฟังก์ชันแสดงรายละเอียด
        window.showDetail = async function(id) {
            const detailContent = document.getElementById('detailModalContent');
            detailContent.innerHTML = '<div class="spinner"></div><div style="text-align: center; margin-top: 10px;">กำลังโหลดรายละเอียด...</div>';
            
            document.getElementById('detailModal').style.display = 'flex';
            
            try {
                // หาข้อมูลจาก allHistoryData ที่โหลดมาแล้ว
                const detailData = allHistoryData.find(item => item.id === id);

                if (!detailData) {
                    // หากไม่พบข้อมูล อาจจะลองดึงใหม่จาก Apps Script
                    const urlWithTimestamp = `${GOOGLE_APPS_SCRIPT_URL}?method=GET_DETAIL&id=${id}&timestamp=${new Date().getTime()}`;
                    const response = await fetch(urlWithTimestamp);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    if (data.status === 'success' && data.data) {
                        renderDetailContent(data.data);
                    } else {
                        throw new Error(data.message || 'ไม่พบรายละเอียดสำหรับรายการนี้');
                    }
                } else {
                    renderDetailContent(detailData);
                }
            } catch (error) {
                console.error('Error loading detail:', error);
                detailContent.innerHTML = `
                    <div class="error" style="padding: 15px; border-radius: 8px;">
                        <i class="fas fa-exclamation-triangle"></i> ไม่สามารถโหลดรายละเอียด: ${error.message}
                    </div>
                `;
            }
        };
        
        // ฟังก์ชันแสดงเนื้อหารายละเอียด
        function renderDetailContent(detailData) {
            const detailContent = document.getElementById('detailModalContent');
            
            detailContent.innerHTML = `
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
                    <span><i class="fas fa-coins"></i> รวมรายรับ:</span>
                    <span>${formatNumber(detailData.totalIncome || 0)} ฿</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-leaf"></i> ค่าท่อม:</span>
                    <span>${formatNumber(detailData.pipeCost || 0)} ฿</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-handshake"></i> ค่าแชร์:</span>
                    <span>${formatNumber(detailData.shareCost || 0)} ฿</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-piggy-bank"></i> เก็บออม:</span>
                    <span>${formatNumber(detailData.savings || 0)} ฿</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-receipt"></i> ค่าใช้จ่ายอื่น:</span>
                    <span>${formatNumber(detailData.otherExpenses || 0)} ฿</span>
                </div>
                <div class="summary-item summary-total">
                    <span><i class="fas fa-money-bill-wave"></i> รวมรายจ่าย:</span>
                    <span>${formatNumber(detailData.totalExpenses || 0)} ฿</span>
                </div>
                <div class="summary-item summary-total">
                    <span><i class="fas fa-wallet"></i> คงเหลือ:</span>
                    <span>${formatNumber(detailData.remaining || 0)} ฿</span>
                </div>
                <div class="summary-item">
                    <span><i class="fas fa-clock"></i> วันที่บันทึก:</span>
                    <span>${detailData.timestamp || 'N/A'}</span>
                </div>
            `;
        }
        
        // ฟังก์ชันส่งข้อมูลไปยัง Google Sheet
        async function submitFormData() {
            const submitBtn = document.getElementById('confirmSaveBtn');
            const salesForm = document.getElementById('salesForm');

            submitBtn.disabled = true;
            const originalButtonText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';

            const formData = getFormDataForSubmission();

            // ตรวจสอบข้อมูลก่อนส่ง
            if (!formData.date || formData.quantity <= 0) {
                showStatus('กรุณากรอกวันที่และจำนวนขวดที่ขายได้ (ต้องมากกว่า 0)', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalButtonText;
                return;
            }

            try {
                const urlWithTimestamp = `${GOOGLE_APPS_SCRIPT_URL}?timestamp=${new Date().getTime()}`;
                
                const response = await fetch(urlWithTimestamp, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        method: 'SAVE_DATA',
                        data: formData
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    showStatus('บันทึกข้อมูลสำเร็จ! ระบบกำลังอัปเดต...', 'success');

                    // รีเซ็ตฟอร์ม
                    salesForm.reset();
                    document.getElementById('date').valueAsDate = new Date();
                    document.getElementById('shareCost').value = '100';
                    document.getElementById('savings').value = '500';
                    calculateRemaining();
                    
                    // รีเฟรชประวัติหลังจากบันทึก
                    setTimeout(loadHistory, 1000);
                } else {
                    throw new Error(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
                }
            } catch (error) {
                console.error('Error:', error);
                showStatus('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalButtonText;
            }
        }
        
        // ฟังก์ชันส่งออกข้อมูล
        async function exportData() {
            try {
                if (allHistoryData.length === 0) {
                    showStatus('ไม่มีข้อมูลที่จะส่งออก', 'warning');
                    return;
                }
                
                showStatus('กำลังเตรียมข้อมูลสำหรับส่งออก...', 'info');
                
                // สร้าง CSV content
                let csvContent = "วันที่,จำนวนขวด,ค้างน้ำดิบ,รายรับ,ค่าท่อม,ค่าแชร์,เก็บออม,ค่าใช้จ่ายอื่น,รายจ่ายรวม,คงเหลือ\n";
                
                allHistoryData.forEach(item => {
                    csvContent += `"${item.date}",${item.quantity},${item.rawWaterDebt},${item.totalIncome},${item.pipeCost},${item.shareCost},${item.savings},${item.otherExpenses},${item.totalExpenses},${item.remaining}\n`;
                });
                
                // สร้าง Blob และดาวน์โหลด
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `SSKratomSystem_Export_${new Date().toISOString().slice(0,10)}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showStatus('ส่งออกข้อมูลสำเร็จ', 'success');
            } catch (error) {
                console.error('Error exporting data:', error);
                showStatus('เกิดข้อผิดพลาดในการส่งออกข้อมูล: ' + error.message, 'error');
            }
        }
        
        // ฟังก์ชันลบข้อมูลทั้งหมด
        async function deleteAllData() {
            const deleteBtn = document.getElementById('confirmDeleteBtn');
            
            deleteBtn.disabled = true;
            const originalButtonText = deleteBtn.innerHTML;
            deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังลบ...';
            
            try {
                const urlWithTimestamp = `${GOOGLE_APPS_SCRIPT_URL}?timestamp=${new Date().getTime()}`;
                
                const response = await fetch(urlWithTimestamp, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        method: 'DELETE_ALL_DATA'
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    showStatus('ลบข้อมูลทั้งหมดสำเร็จ', 'success');
                    document.getElementById('confirmDeleteModal').style.display = 'none';
                    loadHistory();
                } else {
                    throw new Error(result.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
                }
            } catch (error) {
                console.error('Error deleting data:', error);
                showStatus('เกิดข้อผิดพลาดในการลบข้อมูล: ' + error.message, 'error');
            } finally {
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = originalButtonText;
            }
        }
        
        // ฟังก์ชันโหลดรายงานสรุป
        async function loadReports() {
            try {
                const reportPeriod = document.getElementById('reportPeriod').value;
                let startDate, endDate = new Date();
                
                if (reportPeriod === 'custom') {
                    startDate = new Date(document.getElementById('startDate').value);
                    endDate = new Date(document.getElementById('endDate').value);
                    
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        showStatus('กรุณาเลือกวันที่เริ่มต้นและสิ้นสุดให้ถูกต้อง', 'error');
                        return;
                    }
                } else {
                    const days = parseInt(reportPeriod);
                    startDate = new Date();
                    startDate.setDate(endDate.getDate() - days);
                }
                
                // ส่งคำขอไปยัง Google Apps Script
                const urlWithTimestamp = `${GOOGLE_APPS_SCRIPT_URL}?method=GET_REPORT&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&timestamp=${new Date().getTime()}`;
                
                const response = await fetch(urlWithTimestamp);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.status === 'success' && data.report) {
                    renderReport(data.report);
                    showStatus('โหลดรายงานสรุปสำเร็จ', 'success');
                } else {
                    throw new Error(data.message || 'ไม่สามารถโหลดรายงานได้');
                }
            } catch (error) {
                console.error('Error loading reports:', error);
                showStatus('เกิดข้อผิดพลาดในการโหลดรายงาน: ' + error.message, 'error');
            }
        }
        
        // ฟังก์ชันแสดงรายงานสรุป
        function renderReport(reportData) {
            // อัปเดตข้อมูลสรุป
            document.getElementById('daysWithSales').textContent = `${reportData.daysWithSales} วัน`;
            document.getElementById('totalBottlesSold').textContent = `${reportData.totalBottlesSold} ขวด`;
            document.getElementById('totalIncomeReport').textContent = `${formatNumber(reportData.totalIncome)} ฿`;
            document.getElementById('totalExpensesReport').textContent = `${formatNumber(reportData.totalExpenses)} ฿`;
            document.getElementById('netProfit').textContent = `${formatNumber(reportData.netProfit)} ฿`;
            
            // สร้างแผนภูมิ (ถ้ามี)
            const ctx = document.getElementById('expensesPieChart').getContext('2d');
            
            // ทำลายแผนภูมิเดิม (ถ้ามี)
            if (expensesChart) {
                expensesChart.destroy();
            }
            
            expensesChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['ค่าท่อม', 'ค่าแชร์', 'เก็บออม', 'ค่าใช้จ่ายอื่น'],
                    datasets: [{
                        data: [
                            reportData.totalPipeCost,
                            reportData.totalShareCost,
                            reportData.totalSavings,
                            reportData.totalOtherExpenses
                        ],
                        backgroundColor: [
                            'rgba(108, 92, 231, 0.8)',
                            'rgba(253, 203, 110, 0.8)',
                            'rgba(0, 184, 148, 0.8)',
                            'rgba(214, 48, 49, 0.8)'
                        ],
                        borderColor: [
                            'rgba(108, 92, 231, 1)',
                            'rgba(253, 203, 110, 1)',
                            'rgba(0, 184, 148, 1)',
                            'rgba(214, 48, 49, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: {
                                    family: "'Kanit', sans-serif"
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${formatNumber(value)} ฿ (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // ฟังก์ชันส่งออกรายงาน
        async function exportReport() {
            try {
                const reportPeriod = document.getElementById('reportPeriod').value;
                let startDate, endDate = new Date();
                
                if (reportPeriod === 'custom') {
                    startDate = new Date(document.getElementById('startDate').value);
                    endDate = new Date(document.getElementById('endDate').value);
                    
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        showStatus('กรุณาเลือกวันที่เริ่มต้นและสิ้นสุดให้ถูกต้อง', 'error');
                        return;
                    }
                } else {
                    const days = parseInt(reportPeriod);
                    startDate = new Date();
                    startDate.setDate(endDate.getDate() - days);
                }
                
                // สร้าง CSV content สำหรับรายงาน
                let csvContent = "วันที่,จำนวนขวด,รายรับ,ค่าท่อม,ค่าแชร์,เก็บออม,ค่าใช้จ่ายอื่น,รายจ่ายรวม,คงเหลือ\n";
                
                // ดึงข้อมูลรายงานละเอียด
                const urlWithTimestamp = `${GOOGLE_APPS_SCRIPT_URL}?method=GET_DETAILED_REPORT&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&timestamp=${new Date().getTime()}`;
                const response = await fetch(urlWithTimestamp);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.status === 'success' && data.reportDetails) {
                    data.reportDetails.forEach(item => {
                        csvContent += `"${item.date}",${item.quantity},${item.totalIncome},${item.pipeCost},${item.shareCost},${item.savings},${item.otherExpenses},${item.totalExpenses},${item.remaining}\n`;
                    });
                    
                    // สร้าง Blob และดาวน์โหลด
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', `SSKratomSystem_Report_${startDate.toISOString().slice(0,10)}_to_${endDate.toISOString().slice(0,10)}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    showStatus('ส่งออกรายงานสำเร็จ', 'success');
                } else {
                    throw new Error(data.message || 'ไม่สามารถส่งออกรายงานได้');
                }
            } catch (error) {
                console.error('Error exporting report:', error);
                showStatus('เกิดข้อผิดพลาดในการส่งออกรายงาน: ' + error.message, 'error');
            }
        }

        // แสดงสถานะการบันทึก
        function showStatus(message, type) {
            const statusElement = document.getElementById('statusMessage');
            statusElement.textContent = message;
            statusElement.className = type;
            statusElement.style.display = 'block';

            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 5000);
        }

        // คำนวณเริ่มต้น (เรียกเมื่อโหลดหน้าครั้งแรก)
        calculateRemaining();

        // โหลดประวัติเมื่อหน้าเว็บโหลดเสร็จ (ถ้าแท็บประวัติเป็นแท็บ active)
        document.addEventListener('DOMContentLoaded', function() {
            // ตรวจสอบว่า GOOGLE_APPS_SCRIPT_URL ถูกตั้งค่าหรือไม่
            if (typeof GOOGLE_APPS_SCRIPT_URL === 'undefined' || GOOGLE_APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE' || !GOOGLE_APPS_SCRIPT_URL.startsWith('https://script.google.com/macros/s/')) {
                // แสดงสถานะว่ายังไม่ได้ตั้งค่า Apps Script URL
                showStatus('กรุณาตั้งค่า GOOGLE_APPS_SCRIPT_URL ในโค้ดก่อนใช้งาน (ทั้งบันทึกและประวัติ)', 'warning');
                const tbody = document.getElementById('historyTableBody');
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">**กรุณาตั้งค่า Google Apps Script URL ในโค้ด**</td></tr>';
                return;
            }

            if (document.querySelector('.tab.active').dataset.tab === 'history') {
                loadHistory();
            } else if (document.querySelector('.tab.active').dataset.tab === 'reports') {
                loadReports();
            }
        });
    </script>