document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const shortenForm = document.getElementById('shorten-form');
    const longUrlInput = document.getElementById('long-url-input');
    const clearInputBtn = document.getElementById('clear-input-btn');
    const submitBtn = document.getElementById('submit-btn');
    const errorContainer = document.getElementById('error-container');
    const resultContainer = document.getElementById('result-container');
    const shortenedUrl = document.getElementById('shortened-url');
    const copyBtn = document.getElementById('copy-btn');
    
    const historySection = document.getElementById('history-section');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    // Robot Mascot Elements
    const robotMascot = document.getElementById('robot-mascot');
    const robotScreenIcon = document.getElementById('robot-screen-icon');

    // Local Storage History Key
    const HISTORY_KEY = 'shorten_history';

    // Initialize App
    init();

    function init() {
        renderHistory();
        setupEventListeners();
    }

    function setupEventListeners() {
        // Form submission
        shortenForm.addEventListener('submit', handleFormSubmit);

        // Input typing details
        longUrlInput.addEventListener('input', () => {
            if (longUrlInput.value.trim().length > 0) {
                clearInputBtn.style.display = 'flex';
            } else {
                clearInputBtn.style.display = 'none';
            }
            // Clear errors on typing and reset robot
            hideError();
            setRobotState('idle');
        });

        // Clear input button
        clearInputBtn.addEventListener('click', () => {
            longUrlInput.value = '';
            clearInputBtn.style.display = 'none';
            longUrlInput.focus();
            hideError();
            setRobotState('idle');
        });

        // Copy button behavior
        copyBtn.addEventListener('click', () => {
            copyTextToClipboard(shortenedUrl.textContent, copyBtn);
        });

        // Clear entire history
        clearHistoryBtn.addEventListener('click', clearAllHistory);
    }

    // URL Validator
    function isValidUrl(string) {
        try {
            const url = new URL(string.trim());
            return url.protocol === "http:" || url.protocol === "https:";
        } catch (_) {
            return false;
        }
    }

    // Robot Mascot State Manager
    function setRobotState(state) {
        if (!robotMascot) return;
        
        // Reset classes
        robotMascot.classList.remove('state-loading', 'state-success', 'state-error');
        
        // Reset screen icon
        if (robotScreenIcon) {
            robotScreenIcon.className = 'fa-solid fa-heart screen-icon';
        }
        
        if (state === 'loading') {
            robotMascot.classList.add('state-loading');
            if (robotScreenIcon) {
                robotScreenIcon.className = 'fa-solid fa-cog screen-icon';
            }
        } else if (state === 'success') {
            robotMascot.classList.add('state-success');
            if (robotScreenIcon) {
                robotScreenIcon.className = 'fa-solid fa-check screen-icon';
            }
        } else if (state === 'error') {
            robotMascot.classList.add('state-error');
            if (robotScreenIcon) {
                robotScreenIcon.className = 'fa-solid fa-circle-exclamation screen-icon';
            }
        }
    }

    // Hide/Show Errors
    function showError() {
        resultContainer.classList.add('hidden');
        errorContainer.classList.remove('hidden');
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setRobotState('error');
    }

    function hideError() {
        errorContainer.classList.add('hidden');
    }

    // Hide/Show Result
    function showResult(url) {
        hideError();
        shortenedUrl.textContent = url;
        shortenedUrl.href = url;
        resultContainer.classList.remove('hidden');
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setRobotState('success');
    }

    // Submit handler
    async function handleFormSubmit(e) {
        e.preventDefault();
        const rawUrl = longUrlInput.value.trim();

        if (!rawUrl) return;

        if (!isValidUrl(rawUrl)) {
            showError();
            return;
        }

        // Set Loading State
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        hideError();
        setRobotState('loading');

        try {
            const response = await fetch('/api/url/shorten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ longUrl: rawUrl })
            });

            if (!response.ok) {
                // If API returns an error status (like 401/500)
                throw new Error('API request failed');
            }

            const data = await response.json();
            
            if (data && data.shortUrl) {
                showResult(data.shortUrl);
                saveToHistory(data);
            } else {
                showError();
            }

        } catch (err) {
            console.error(err);
            showError();
        } finally {
            // Remove Loading State
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    // Copy to clipboard helper
    function copyTextToClipboard(text, btnElement) {
        if (!navigator.clipboard) {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";  // Avoid scrolling to bottom
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                setCopySuccess(btnElement);
            } catch (err) {
                console.error('Fallback copy failed', err);
            }
            document.body.removeChild(textArea);
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess(btnElement);
        }, (err) => {
            console.error('Async copy failed', err);
        });
    }

    function setCopySuccess(btnElement) {
        const originalContent = btnElement.innerHTML;
        btnElement.innerHTML = `<i class="fa-solid fa-check" style="color: var(--success-color)"></i> <span style="color: var(--success-color)">Copied!</span>`;
        btnElement.style.borderColor = 'var(--success-border)';
        btnElement.style.backgroundColor = 'var(--success-bg)';
        
        setTimeout(() => {
            btnElement.innerHTML = originalContent;
            btnElement.style.borderColor = '';
            btnElement.style.backgroundColor = '';
        }, 2000);
    }

    // --- History Management ---

    function getHistory() {
        const historyData = localStorage.getItem(HISTORY_KEY);
        return historyData ? JSON.parse(historyData) : [];
    }

    function saveToHistory(newUrlObj) {
        let history = getHistory();
        
        // Remove existing item if same longUrl to prevent duplicates and put at top
        history = history.filter(item => item.longUrl !== newUrlObj.longUrl);
        
        // Prepend new item
        history.unshift(newUrlObj);
        
        // Limit history to 8 items to stay sleek
        if (history.length > 8) {
            history.pop();
        }

        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        renderHistory();
    }

    function deleteHistoryItem(longUrl) {
        let history = getHistory();
        history = history.filter(item => item.longUrl !== longUrl);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        renderHistory();
    }

    function clearAllHistory() {
        if (confirm('Are you sure you want to clear your link history?')) {
            localStorage.removeItem(HISTORY_KEY);
            renderHistory();
        }
    }

    function renderHistory() {
        const history = getHistory();

        if (history.length === 0) {
            historySection.classList.add('hidden');
            historyList.innerHTML = '';
            return;
        }

        historySection.classList.remove('hidden');
        historyList.innerHTML = '';

        history.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'history-item';
            
            // Shorten display name for long urls
            let displayLongUrl = item.longUrl;
            if (displayLongUrl.length > 55) {
                displayLongUrl = displayLongUrl.substring(0, 52) + '...';
            }

            itemEl.innerHTML = `
                <div class="history-links">
                    <span class="history-original" title="${item.longUrl}">${displayLongUrl}</span>
                    <a href="${item.shortUrl}" class="history-short" target="_blank" rel="noopener noreferrer">${item.shortUrl}</a>
                </div>
                <div class="history-actions">
                    <button class="btn-icon btn-copy" aria-label="Copy link">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                    <button class="btn-icon btn-delete" aria-label="Delete item">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            `;

            // Wire up copy button in history
            const itemCopyBtn = itemEl.querySelector('.btn-copy');
            itemCopyBtn.addEventListener('click', () => {
                copyTextToClipboard(item.shortUrl, itemCopyBtn);
            });

            // Wire up delete button in history
            const itemDeleteBtn = itemEl.querySelector('.btn-delete');
            itemDeleteBtn.addEventListener('click', () => {
                deleteHistoryItem(item.longUrl);
            });

            historyList.appendChild(itemEl);
        });
    }
});
