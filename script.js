// ============================================================
// 0. CHẶN CHUỘT PHẢI & QUÉT KHỐI
// ============================================================
// Chặn menu chuột phải
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

// Chặn chọn văn bản (quét khối)
document.addEventListener('selectstart', function(e) {
    e.preventDefault();
    return false;
});

// Chặn copy bằng Ctrl+C (trừ khi là input)
document.addEventListener('copy', function(e) {
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return true;
    }
    e.preventDefault();
    return false;
});

// Chặn cut, paste
document.addEventListener('cut', function(e) {
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return true;
    }
    e.preventDefault();
    return false;
});

document.addEventListener('paste', function(e) {
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return true;
    }
    e.preventDefault();
    return false;
});

// Chặn kéo thả văn bản
document.addEventListener('dragstart', function(e) {
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return true;
    }
    e.preventDefault();
    return false;
});

// Chặn Ctrl+A, Ctrl+C, Ctrl+X
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            return true;
        }
        e.preventDefault();
        return false;
    }
    
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X')) {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            return true;
        }
        if (target.closest('.char-item')) {
            return true;
        }
        e.preventDefault();
        return false;
    }
});

// CSS chặn chọn văn bản
const styleBlock = document.createElement('style');
styleBlock.textContent = `
    body {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }
    input, textarea {
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
    }
    .char-item {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        cursor: pointer;
    }
`;
document.head.appendChild(styleBlock);

// ============================================================
// 1. CẤU HÌNH URL WORKER (CẬP NHẬT ĐÚNG ĐỊA CHỈ CỦA BẠN)
// ============================================================
const WORKER_URL = 'https://han-nom-api.cuongprovuimusic.workers.dev';

// ============================================================
// 2. HÀM TRA TỪ QUA WORKER
// ============================================================
async function lookupViaWorker(word) {
    try {
        const response = await fetch(`${WORKER_URL}/lookup?word=${encodeURIComponent(word)}`);
        const data = await response.json();
        
        if (data.success) {
            return data.results || [];
        } else {
            console.warn('Worker error:', data.error);
            return [];
        }
    } catch (error) {
        console.error('Lỗi kết nối Worker:', error);
        return [];
    }
}

// ============================================================
// 3. HIỂN THỊ KẾT QUẢ
// ============================================================
function displayResults(results, searchWord) {
    const charList = document.getElementById('charList');
    const infoBar = document.getElementById('infoBar');

    if (!results || results.length === 0) {
        charList.innerHTML = `<span class="empty-placeholder">😕 Không tìm thấy chữ Hán Nôm cho "${searchWord}"</span>`;
        infoBar.textContent = '💡 Thử nhập từ khác hoặc kiểm tra chính tả';
        infoBar.style.color = '#886644';
        return;
    }

    // Sắp xếp: ưu tiên chữ Hán trước
    results.sort((a, b) => {
        const isHanA = /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(a);
        const isHanB = /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(b);
        if (isHanA && !isHanB) return -1;
        if (!isHanA && isHanB) return 1;
        return a.localeCompare(b);
    });

    // Tạo các item với sự kiện copy
    const html = results.map(char => 
        `<span class="char-item" data-char="${char}">${char}</span>`
    ).join('');

    charList.innerHTML = html;
    infoBar.textContent = `📚 Tìm thấy ${results.length} ký tự Hán Nôm cho "${searchWord}" (nhấn giữ để sao chép)`;
    infoBar.style.color = '#886644';

    // Thêm sự kiện copy cho từng chữ
    document.querySelectorAll('.char-item').forEach(item => {
        let holdTimer = null;
        
        // Click để copy
        item.addEventListener('click', function() {
            copyToClipboard(this.dataset.char);
        });

        // Touch và giữ để copy
        item.addEventListener('touchstart', function() {
            holdTimer = setTimeout(() => {
                copyToClipboard(this.dataset.char);
                if (navigator.vibrate) navigator.vibrate(30);
            }, 400);
        });

        item.addEventListener('touchend', function() { clearTimeout(holdTimer); });
        item.addEventListener('touchmove', function() { clearTimeout(holdTimer); });

        // Mouse down/up để copy
        item.addEventListener('mousedown', function() {
            holdTimer = setTimeout(() => {
                copyToClipboard(this.dataset.char);
            }, 400);
        });

        item.addEventListener('mouseup', function() { clearTimeout(holdTimer); });
        item.addEventListener('mouseleave', function() { clearTimeout(holdTimer); });
    });
}

// ============================================================
// 4. HÀM COPY
// ============================================================
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showCopyFeedback(text);
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showCopyFeedback(text);
    } catch (err) {
        console.warn('Copy failed:', err);
    }
    document.body.removeChild(textarea);
}

function showCopyFeedback(char) {
    const infoBar = document.getElementById('infoBar');
    const originalText = infoBar.textContent;
    infoBar.textContent = `✅ Đã sao chép: "${char}"`;
    infoBar.style.color = '#4caf50';
    setTimeout(() => {
        infoBar.style.color = '#886644';
        const results = document.querySelectorAll('.char-item');
        if (results.length > 0) {
            infoBar.textContent = `📚 Tìm thấy ${results.length} ký tự Hán Nôm (nhấn giữ để sao chép)`;
        } else {
            infoBar.textContent = originalText;
        }
    }, 2000);
}

// ============================================================
// 5. KHỞI TẠO & SỰ KIỆN
// ============================================================
document.addEventListener('DOMContentLoaded', async function() {
    const charList = document.getElementById('charList');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const infoBar = document.getElementById('infoBar');
    
    // Hiển thị trạng thái loading
    charList.innerHTML = `<span class="empty-placeholder">⏳ Đang kết nối đến server...</span>`;
    
    // Kiểm tra kết nối Worker
    try {
        const response = await fetch(WORKER_URL);
        const data = await response.json();
        console.log('✅ Worker status:', data);
        
        if (data.kv_status === '✅ Đã kết nối') {
            infoBar.textContent = `✅ Đã kết nối server (${data.data_size})`;
            infoBar.style.color = '#4caf50';
        }
        charList.innerHTML = `<span class="empty-placeholder">🔍 Chỉ Tra Từ Không Giảng Nghĩa</span>`;
    } catch (error) {
        console.error('Lỗi kết nối Worker:', error);
        charList.innerHTML = `<span class="empty-placeholder">❌ Lỗi kết nối server</span>`;
        infoBar.textContent = '⚠️ Không thể kết nối đến server';
        infoBar.style.color = '#ff6b6b';
    }

    // Hàm xử lý tra cứu
    async function handleSearch() {
        const word = searchInput.value.trim();
        if (!word) {
            charList.innerHTML = `<span class="empty-placeholder">🔍 Chỉ Tra Từ Không Giảng Nghĩa</span>`;
            infoBar.textContent = '';
            return;
        }
        
        // Hiển thị loading
        charList.innerHTML = `<span class="empty-placeholder">⏳ Đang tra từ "${word}"...</span>`;
        infoBar.textContent = `⏳ Đang tìm kiếm...`;
        
        // Gọi API Worker
        const results = await lookupViaWorker(word);
        displayResults(results, word);
    }

    // Sự kiện
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') handleSearch();
    });

    // Focus vào input
    searchInput.focus();
});