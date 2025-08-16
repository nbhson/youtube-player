/**
 * YouTube Bypass Player Application
 * A modern interface for playing YouTube videos with enhanced privacy
 */

// ============================================================================
// Constants
// ============================================================================
const CONFIG = {
    DEFAULT_VIDEO_ID: 'sru72Wk20Y0',
    MESSAGE_DISPLAY_TIME: 3000,
    MESSAGE_ANIMATION_DELAY: 100,
    MESSAGE_REMOVE_DELAY: 300,
    YOUTUBE_EMBED_BASE_URL: 'https://www.youtube-nocookie.com/embed/',
    YOUTUBE_EMBED_PARAMS: 'rel=0&playsinline=1&modestbranding=1&autoplay=1&mute=0',
    SUGGESTED_VIDEOS_COUNT: 10,
    YOUTUBE_API_KEY: 'AIzaSyAXZ2ntfnxiUDPQJq_FjCUIy6wKbqcxuWQ', // Can be changed
    YOUTUBE_API_BASE_URL: 'https://www.googleapis.com/youtube/v3'
};

const MESSAGES = {
    EMPTY_INPUT: 'Please paste a YouTube link first',
    INVALID_LINK: 'Invalid YouTube link. Please check your URL and try again.',
    SUCCESS_LOAD: 'Video loaded successfully!'
};

const YOUTUBE_URL_PATTERNS = [
    /[?&]v=([a-zA-Z0-9_-]+)/,
    /\/shorts\/([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /\/embed\/([a-zA-Z0-9_-]+)/
];

// ============================================================================
// DOM Elements
// ============================================================================
const DOM = {
    youtubeLinkInput: document.getElementById('youtubeLink'),
    loadButton: document.getElementById('loadButton'),
    videoPlayer: document.getElementById('videoPlayer'),
    messageContainer: document.getElementById('messageContainer'),
    suggestedVideosContainer: document.getElementById('suggestedVideosContainer'),
    refreshSuggestionsBtn: document.getElementById('refreshSuggestions'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveApiKeyBtn: document.getElementById('saveApiKey'),
    toggleApiKeyBtn: document.getElementById('toggleApiKey'),
    apiKeyStatus: document.getElementById('apiKeyStatus')
};

// ============================================================================
// App State
// ============================================================================
class AppState {
    constructor() {
        this.currentVideoId = CONFIG.DEFAULT_VIDEO_ID;
        this.apiKey = this.loadApiKey();
    }

    setVideoId(videoId) {
        this.currentVideoId = videoId;
    }

    getVideoId() {
        return this.currentVideoId;
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('youtube_api_key', apiKey);
    }

    getApiKey() {
        return this.apiKey || CONFIG.YOUTUBE_API_KEY;
    }

    loadApiKey() {
        return localStorage.getItem('youtube_api_key') || null;
    }

    hasValidApiKey() {
        const apiKey = this.getApiKey();
        const isValid = apiKey && apiKey !== 'YOUR_YOUTUBE_API_KEY_HERE' && apiKey.length > 10;
        console.log('API Key validation:', {
            hasKey: !!apiKey,
            isNotDefault: apiKey !== 'YOUR_YOUTUBE_API_KEY_HERE',
            length: apiKey ? apiKey.length : 0,
            isValid: isValid
        });
        return isValid;
    }
}

const appState = new AppState();

// ============================================================================
// Utility Functions
// ============================================================================
class YouTubeUtils {
    /**
     * Extract video ID from various YouTube URL formats
     * @param {string} url - YouTube URL
     * @returns {string|null} - Video ID or null if not found
     */
    static extractVideoId(url) {
        if (!url || typeof url !== 'string') {
            return null;
        }

        for (const pattern of YOUTUBE_URL_PATTERNS) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }

    /**
     * Build YouTube embed URL with parameters
     * @param {string} videoId - YouTube video ID
     * @returns {string} - Complete embed URL
     */
    static buildEmbedUrl(videoId) {
        const origin = window.location.origin;
        const params = `${CONFIG.YOUTUBE_EMBED_PARAMS}&origin=${origin}`;
        return `${CONFIG.YOUTUBE_EMBED_BASE_URL}${videoId}?${params}`;
    }

    /**
     * Fetch suggested videos from YouTube API
     * @param {string} videoId - Current video ID for related videos
     * @returns {Promise<Array>} - Array of suggested videos
     */
    static async fetchSuggestedVideos(videoId) {
        try {
            const apiKey = appState.getApiKey();
            if (!appState.hasValidApiKey()) {
                throw new Error('API key not configured');
            }

            const url = `${CONFIG.YOUTUBE_API_BASE_URL}/search?part=snippet&relatedToVideoId=${videoId}&type=video&maxResults=${CONFIG.SUGGESTED_VIDEOS_COUNT}&key=${apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('Error fetching suggested videos:', error);
            return [];
        }
    }

    /**
     * Fetch video details for suggested videos
     * @param {Array} videoIds - Array of video IDs
     * @returns {Promise<Array>} - Array of video details
     */
    static async fetchVideoDetails(videoIds) {
        try {
            const apiKey = appState.getApiKey();
            if (!appState.hasValidApiKey()) {
                throw new Error('API key not configured');
            }

            const ids = videoIds.join(',');
            const url = `${CONFIG.YOUTUBE_API_BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${ids}&key=${apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('Error fetching video details:', error);
            return [];
        }
    }

    /**
     * Format view count with K, M, B suffixes
     * @param {string} viewCount - Raw view count
     * @returns {string} - Formatted view count
     */
    static formatViewCount(viewCount) {
        const count = parseInt(viewCount);
        if (count >= 1000000000) {
            return (count / 1000000000).toFixed(1) + 'B';
        } else if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    }

    /**
     * Format duration from ISO 8601 format
     * @param {string} duration - ISO 8601 duration string
     * @returns {string} - Formatted duration
     */
    static formatDuration(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        const hours = (match[1] || '').replace('H', '');
        const minutes = (match[2] || '').replace('M', '');
        const seconds = (match[3] || '').replace('S', '');
        
        if (hours) {
            return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.padStart(2, '0')}`;
        }
    }
}

// ============================================================================
// API Key Controller
// ============================================================================
class ApiKeyController {
    /**
     * Initialize API key section
     */
    static init() {
        console.log('Initializing API Key Controller...');
        this.loadSavedApiKey();
        console.log('Saved API key loaded');
        this.updateStatus();
        console.log('API key status updated');
        this.bindEvents();
        console.log('API key events bound');
    }

    /**
     * Load saved API key from localStorage
     */
    static loadSavedApiKey() {
        const savedApiKey = appState.loadApiKey();
        console.log('Saved API key from localStorage:', savedApiKey ? 'Found' : 'Not found');
        if (savedApiKey && DOM.apiKeyInput) {
            DOM.apiKeyInput.value = savedApiKey;
            console.log('API key loaded into input field');
        } else {
            console.log('No saved API key or input field not found');
        }
    }

    /**
     * Update API key status display
     */
    static updateStatus() {
        if (!DOM.apiKeyStatus) return;

        const hasValidKey = appState.hasValidApiKey();
        const statusElement = DOM.apiKeyStatus;
        const iconElement = statusElement.querySelector('.api-key-section__status-icon');
        const textElement = statusElement.querySelector('.api-key-section__status-text');

        if (hasValidKey) {
            statusElement.className = 'api-key-section__status api-key-section__status--success';
            iconElement.textContent = '✅';
            textElement.textContent = 'API key configured successfully';
        } else {
            statusElement.className = 'api-key-section__status api-key-section__status--error';
            iconElement.textContent = '⚠️';
            textElement.textContent = 'API key not configured';
        }
    }

    /**
     * Save API key
     */
    static saveApiKey() {
        const apiKey = DOM.apiKeyInput?.value?.trim();
        console.log('Saving API key:', apiKey ? 'Key provided' : 'No key');
        
        if (!apiKey) {
            MessageSystem.show('Please enter an API key', 'error');
            return;
        }

        if (apiKey.length < 10) {
            MessageSystem.show('API key seems too short', 'error');
            return;
        }

        console.log('API key validation passed, saving...');
        appState.setApiKey(apiKey);
        this.updateStatus();
        MessageSystem.show('API key saved successfully!', 'success');

        // Refresh suggestions if there's a current video
        const currentVideoId = appState.getVideoId();
        console.log('Current video ID:', currentVideoId);
        if (currentVideoId && currentVideoId !== CONFIG.DEFAULT_VIDEO_ID) {
            console.log('Loading suggested videos after API key save...');
            SuggestedVideosController.loadSuggestedVideos(currentVideoId);
        } else {
            console.log('No current video or default video, not loading suggestions');
        }
    }

    /**
     * Toggle API key visibility
     */
    static toggleApiKeyVisibility() {
        if (!DOM.apiKeyInput || !DOM.toggleApiKeyBtn) return;

        const isPassword = DOM.apiKeyInput.type === 'password';
        DOM.apiKeyInput.type = isPassword ? 'text' : 'password';
        
        const toggleBtn = DOM.toggleApiKeyBtn.querySelector('span');
        toggleBtn.textContent = isPassword ? '🙈' : '👁️';
    }

    /**
     * Bind API key events
     */
    static bindEvents() {
        if (DOM.saveApiKeyBtn) {
            DOM.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        }

        if (DOM.toggleApiKeyBtn) {
            DOM.toggleApiKeyBtn.addEventListener('click', () => this.toggleApiKeyVisibility());
        }

        if (DOM.apiKeyInput) {
            DOM.apiKeyInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    this.saveApiKey();
                }
            });
        }
    }
}

// ============================================================================
// Suggested Videos Controller
// ============================================================================
class SuggestedVideosController {
    /**
     * Load suggested videos for current video
     * @param {string} videoId - Current video ID
     */
    static async loadSuggestedVideos(videoId) {
        try {
            console.log('Loading suggested videos for video ID:', videoId);
            this.showLoading();
            
            // Check if API key is valid
            if (!appState.hasValidApiKey()) {
                console.log('API key not valid, showing error');
                this.showError('Please configure API key first');
                return;
            }
            
            // Fetch suggested videos
            console.log('Fetching suggested videos...');
            const suggestedVideos = await YouTubeUtils.fetchSuggestedVideos(videoId);
            console.log('Suggested videos fetched:', suggestedVideos.length);
            
            if (suggestedVideos.length === 0) {
                console.log('No suggested videos found');
                this.showError('No suggestions available');
                return;
            }
            
            // Get video IDs
            const videoIds = suggestedVideos.map(video => video.id.videoId);
            console.log('Video IDs to fetch details:', videoIds);
            
            // Fetch detailed information
            console.log('Fetching video details...');
            const videoDetails = await YouTubeUtils.fetchVideoDetails(videoIds);
            console.log('Video details fetched:', videoDetails.length);
            
            // Display suggested videos
            this.displaySuggestedVideos(videoDetails);
            
        } catch (error) {
            console.error('Error loading suggested videos:', error);
            this.showError(`Failed to load suggestions: ${error.message}`);
        }
    }

    /**
     * Display suggested videos in the UI
     * @param {Array} videos - Array of video details
     */
    static displaySuggestedVideos(videos) {
        if (!DOM.suggestedVideosContainer) {
            console.error('Suggested videos container not found');
            return;
        }

        console.log('Displaying suggested videos:', videos.length);
        const html = videos.map(video => this.createVideoCardHTML(video)).join('');
        DOM.suggestedVideosContainer.innerHTML = html;

        // Add click event listeners
        this.bindVideoCardEvents();
        console.log('Suggested videos displayed successfully');
    }

    /**
     * Create HTML for a video card
     * @param {Object} video - Video object
     * @returns {string} - HTML string
     */
    static createVideoCardHTML(video) {
        const { snippet, statistics, contentDetails } = video;
        const thumbnail = snippet.thumbnails.medium || snippet.thumbnails.default;
        const viewCount = statistics?.viewCount ? YouTubeUtils.formatViewCount(statistics.viewCount) : 'Unknown';
        const duration = contentDetails?.duration ? YouTubeUtils.formatDuration(contentDetails.duration) : 'Unknown';

        return `
            <div class="suggested-video-card" data-video-id="${video.id}">
                <div class="suggested-video-card__thumbnail">
                    <img src="${thumbnail.url}" alt="${snippet.title}" loading="lazy">
                </div>
                <div class="suggested-video-card__content">
                    <h4 class="suggested-video-card__title">${snippet.title}</h4>
                    <p class="suggested-video-card__channel">${snippet.channelTitle}</p>
                    <div class="suggested-video-card__meta">
                        <span class="suggested-video-card__views">${viewCount}</span>
                        <span class="suggested-video-card__duration">${duration}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind click events to video cards
     */
    static bindVideoCardEvents() {
        const videoCards = document.querySelectorAll('.suggested-video-card');
        videoCards.forEach(card => {
            card.addEventListener('click', () => {
                const videoId = card.dataset.videoId;
                if (videoId) {
                    VideoPlayerController.loadVideoById(videoId);
                }
            });
        });
    }

    /**
     * Show loading state
     */
    static showLoading() {
        if (!DOM.suggestedVideosContainer) {
            console.error('Suggested videos container not found');
            return;
        }
        
        console.log('Showing loading state');
        DOM.suggestedVideosContainer.innerHTML = `
            <div class="suggested-videos-section__loading">
                <div class="suggested-videos-section__loading-spinner"></div>
                <p>Loading suggestions...</p>
            </div>
        `;
    }

    /**
     * Show error state
     * @param {string} message - Error message
     */
    static showError(message) {
        if (!DOM.suggestedVideosContainer) {
            console.error('Suggested videos container not found');
            return;
        }
        
        console.log('Showing error:', message);
        DOM.suggestedVideosContainer.innerHTML = `
            <div class="suggested-videos-section__loading">
                <p>❌ ${message}</p>
                <button onclick="SuggestedVideosController.refreshSuggestions()" style="margin-top: 10px; padding: 8px 16px; background: var(--color-blue); color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Try Again
                </button>
            </div>
        `;
    }

    /**
     * Refresh suggestions
     */
    static refreshSuggestions() {
        const currentVideoId = appState.getVideoId();
        if (currentVideoId) {
            this.loadSuggestedVideos(currentVideoId);
        }
    }
}

// ============================================================================
// Message System
// ============================================================================
class MessageSystem {
    /**
     * Show a message notification
     * @param {string} text - Message text
     * @param {string} type - Message type ('success' or 'error')
     */
    static show(text, type = 'success') {
        if (!DOM.messageContainer) {
            console.error('Message container not found');
            return;
        }

        const message = this.createMessageElement(text, type);
        DOM.messageContainer.appendChild(message);

        // Trigger animation
        setTimeout(() => {
            message.classList.add('message--show');
        }, CONFIG.MESSAGE_ANIMATION_DELAY);

        // Remove message after display time
        setTimeout(() => {
            this.hideMessage(message);
        }, CONFIG.MESSAGE_DISPLAY_TIME);
    }

    /**
     * Create message element
     * @param {string} text - Message text
     * @param {string} type - Message type
     * @returns {HTMLElement} - Message element
     */
    static createMessageElement(text, type) {
        const message = document.createElement('div');
        message.className = `message message--${type}`;
        message.textContent = text;
        return message;
    }

    /**
     * Hide and remove message element
     * @param {HTMLElement} message - Message element to hide
     */
    static hideMessage(message) {
        message.classList.remove('message--show');
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, CONFIG.MESSAGE_REMOVE_DELAY);
    }
}

// ============================================================================
// Video Player Controller
// ============================================================================
class VideoPlayerController {
    /**
     * Load video by URL
     * @param {string} youtubeUrl - YouTube URL
     */
    static async loadVideo(youtubeUrl) {
        try {
            console.log('Loading video with URL:', youtubeUrl);
            const trimmedUrl = youtubeUrl.trim();
            
            if (!trimmedUrl) {
                MessageSystem.show(MESSAGES.EMPTY_INPUT, 'error');
                return false;
            }

            const videoId = YouTubeUtils.extractVideoId(trimmedUrl);
            console.log('Extracted video ID:', videoId);
            
            if (!videoId) {
                MessageSystem.show(MESSAGES.INVALID_LINK, 'error');
                return false;
            }

            this.updateVideoPlayer(videoId);
            this.clearInput();
            
            // Load suggested videos
            console.log('Loading suggested videos for new video...');
            await SuggestedVideosController.loadSuggestedVideos(videoId);
            
            MessageSystem.show(MESSAGES.SUCCESS_LOAD, 'success');
            return true;

        } catch (error) {
            console.error('Error loading video:', error);
            MessageSystem.show('An error occurred while loading the video', 'error');
            return false;
        }
    }

    /**
     * Update video player with new video ID
     * @param {string} videoId - YouTube video ID
     */
    static updateVideoPlayer(videoId) {
        if (!DOM.videoPlayer) {
            console.error('Video player element not found');
            return;
        }

        appState.setVideoId(videoId);
        const embedUrl = YouTubeUtils.buildEmbedUrl(videoId);
        DOM.videoPlayer.src = embedUrl;
    }

    /**
     * Load video by ID (for suggested videos)
     * @param {string} videoId - YouTube video ID
     */
    static async loadVideoById(videoId) {
        this.updateVideoPlayer(videoId);
        
        // Load suggested videos for the new video
        await SuggestedVideosController.loadSuggestedVideos(videoId);
        
        MessageSystem.show('Video loaded successfully!', 'success');
    }

    /**
     * Clear input field
     */
    static clearInput() {
        if (DOM.youtubeLinkInput) {
            DOM.youtubeLinkInput.value = '';
        }
    }
}

// ============================================================================
// Event Handlers
// ============================================================================
class EventHandlers {
    /**
     * Handle load button click
     */
    static async handleLoadButtonClick() {
        const youtubeUrl = DOM.youtubeLinkInput?.value || '';
        await VideoPlayerController.loadVideo(youtubeUrl);
    }

    /**
     * Handle input field keypress
     * @param {KeyboardEvent} event - Keypress event
     */
    static async handleInputKeypress(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            await this.handleLoadButtonClick();
        }
    }
}

// ============================================================================
// Event Listeners
// ============================================================================
class EventListeners {
    /**
     * Initialize all event listeners
     */
    static init() {
        this.bindLoadButton();
        this.bindInputField();
        this.bindRefreshSuggestions();
    }

    /**
     * Bind load button event listener
     */
    static bindLoadButton() {
        if (DOM.loadButton) {
            DOM.loadButton.addEventListener('click', EventHandlers.handleLoadButtonClick.bind(EventHandlers));
        } else {
            console.error('Load button not found');
        }
    }

    /**
     * Bind input field event listener
     */
    static bindInputField() {
        if (DOM.youtubeLinkInput) {
            DOM.youtubeLinkInput.addEventListener('keypress', EventHandlers.handleInputKeypress.bind(EventHandlers));
        } else {
            console.error('YouTube link input not found');
        }
    }

    /**
     * Bind refresh suggestions button
     */
    static bindRefreshSuggestions() {
        if (DOM.refreshSuggestionsBtn) {
            DOM.refreshSuggestionsBtn.addEventListener('click', () => {
                SuggestedVideosController.refreshSuggestions();
            });
        }
    }
}

// ============================================================================
// Application Initialization
// ============================================================================
class YouTubeBypassApp {
    /**
     * Initialize the application
     */
    static init() {
        try {
            console.log('Initializing YouTube Bypass App...');
            this.validateDOM();
            console.log('DOM validation passed');
            EventListeners.init();
            console.log('Event listeners initialized');
            ApiKeyController.init();
            console.log('API Key Controller initialized');
            
            // Try to load suggested videos for default video if API key is available
            setTimeout(() => {
                if (appState.hasValidApiKey()) {
                    console.log('Loading suggested videos for default video...');
                    SuggestedVideosController.loadSuggestedVideos(CONFIG.DEFAULT_VIDEO_ID);
                } else {
                    console.log('No valid API key, skipping default video suggestions');
                }
            }, 1000);
            
            console.log('YouTube Bypass App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    /**
     * Validate that all required DOM elements exist
     */
    static validateDOM() {
        const requiredElements = [
            'youtubeLinkInput',
            'loadButton', 
            'videoPlayer',
            'messageContainer'
        ];

        const missingElements = requiredElements.filter(element => !DOM[element]);
        
        if (missingElements.length > 0) {
            throw new Error(`Missing required DOM elements: ${missingElements.join(', ')}`);
        }
    }
}

// ============================================================================
// Application Startup
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    YouTubeBypassApp.init();
});