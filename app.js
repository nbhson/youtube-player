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
    YOUTUBE_EMBED_PARAMS: 'rel=0&playsinline=1&modestbranding=1&autoplay=1&mute=0'
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
    messageContainer: document.getElementById('messageContainer')
};

// ============================================================================
// App State
// ============================================================================
class AppState {
    constructor() {
        this.currentVideoId = CONFIG.DEFAULT_VIDEO_ID;
    }

    setVideoId(videoId) {
        this.currentVideoId = videoId;
    }

    getVideoId() {
        return this.currentVideoId;
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
    static loadVideo(youtubeUrl) {
        try {
            const trimmedUrl = youtubeUrl.trim();
            
            if (!trimmedUrl) {
                MessageSystem.show(MESSAGES.EMPTY_INPUT, 'error');
                return false;
            }

            const videoId = YouTubeUtils.extractVideoId(trimmedUrl);
            
            if (!videoId) {
                MessageSystem.show(MESSAGES.INVALID_LINK, 'error');
                return false;
            }

            this.updateVideoPlayer(videoId);
            this.clearInput();
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
    static handleLoadButtonClick() {
        const youtubeUrl = DOM.youtubeLinkInput?.value || '';
        VideoPlayerController.loadVideo(youtubeUrl);
    }

    /**
     * Handle input field keypress
     * @param {KeyboardEvent} event - Keypress event
     */
    static handleInputKeypress(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleLoadButtonClick();
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
            this.validateDOM();
            EventListeners.init();
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