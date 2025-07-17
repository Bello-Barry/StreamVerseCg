"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNotifications = exports.notificationService = void 0;
var NotificationService = /** @class */ (function () {
    function NotificationService() {
        this.permission = typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
        this.notifications = [];
        this.serviceWorkerRegistration = null;
        this.settings = this.loadSettings();
        if (typeof window !== 'undefined') {
            this.initializePermission();
            this.registerServiceWorker();
        }
    }
    NotificationService.prototype.loadSettings = function () {
        if (typeof window === 'undefined')
            return this.getDefaultSettings();
        try {
            var stored = localStorage.getItem("streamverse_notification_settings");
            if (stored) {
                return __assign(__assign({}, this.getDefaultSettings()), JSON.parse(stored));
            }
        }
        catch (error) {
            console.warn("Failed to load notification settings:", error);
        }
        return this.getDefaultSettings();
    };
    NotificationService.prototype.getDefaultSettings = function () {
        return {
            enabled: true,
            channelUpdates: true,
            playlistUpdates: true,
            favoriteChannelUpdates: true,
            systemNotifications: true,
            sound: true,
            vibrate: true
        };
    };
    NotificationService.prototype.saveSettings = function () {
        if (typeof window === 'undefined')
            return;
        try {
            localStorage.setItem("streamverse_notification_settings", JSON.stringify(this.settings));
        }
        catch (error) {
            console.warn("Failed to save notification settings:", error);
        }
    };
    NotificationService.prototype.initializePermission = function () {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                if (typeof window === 'undefined' || !('Notification' in window))
                    return [2 /*return*/];
                this.permission = Notification.permission;
                if (this.permission === 'default') {
                    // Don't request permission automatically, let user enable it
                }
                return [2 /*return*/];
            });
        });
    };
    NotificationService.prototype.registerServiceWorker = function () {
        return __awaiter(this, void 0, Promise, function () {
            var _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (typeof window === 'undefined' || !('serviceWorker' in navigator))
                            return [2 /*return*/];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        _a = this;
                        return [4 /*yield*/, navigator.serviceWorker.register("/sw.js")];
                    case 2:
                        _a.serviceWorkerRegistration = _b.sent();
                        console.log("Service Worker registered successfully");
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _b.sent();
                        console.warn("Service Worker registration failed:", error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.requestPermission = function () {
        return __awaiter(this, void 0, Promise, function () {
            var permission;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof window === 'undefined' || !('Notification' in window)) {
                            console.warn("This browser does not support notifications");
                            return [2 /*return*/, false];
                        }
                        if (this.permission === 'granted') {
                            return [2 /*return*/, true];
                        }
                        return [4 /*yield*/, Notification.requestPermission()];
                    case 1:
                        permission = _a.sent();
                        this.permission = permission;
                        if (permission === 'granted') {
                            this.settings.enabled = true;
                            this.saveSettings();
                            return [2 /*return*/, true];
                        }
                        return [2 /*return*/, false];
                }
            });
        });
    };
    NotificationService.prototype.getSettings = function () {
        return __assign({}, this.settings);
    };
    NotificationService.prototype.updateSettings = function (newSettings) {
        this.settings = __assign(__assign({}, this.settings), newSettings);
        this.saveSettings();
    };
    NotificationService.prototype.showNotification = function (data) {
        return __awaiter(this, void 0, Promise, function () {
            var notification, browserNotification_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof window === 'undefined' || !this.settings.enabled || this.permission !== 'granted') {
                            return [2 /*return*/];
                        }
                        notification = __assign(__assign({}, data), { id: "notification_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)), timestamp: Date.now() });
                        // Check if this type of notification is enabled
                        if (!this.isNotificationTypeEnabled(notification.type)) {
                            return [2 /*return*/];
                        }
                        this.notifications.push(notification);
                        this.saveNotifications();
                        if (!this.serviceWorkerRegistration) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.serviceWorkerRegistration.showNotification(notification.title, {
                                body: notification.body,
                                icon: notification.icon || "/icons/icon-192x192.png",
                                badge: notification.badge || "/icons/icon-72x72.png",
                                image: notification.image,
                                tag: notification.tag,
                                data: notification.data,
                                actions: notification.actions,
                                vibrate: this.settings.vibrate ? [200, 100, 200] : undefined,
                                silent: !this.settings.sound,
                                requireInteraction: notification.type === 'error',
                                timestamp: notification.timestamp
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        browserNotification_1 = new Notification(notification.title, {
                            body: notification.body,
                            icon: notification.icon || "/icons/icon-192x192.png",
                            tag: notification.tag,
                            data: notification.data,
                            vibrate: this.settings.vibrate ? [200, 100, 200] : undefined,
                            silent: !this.settings.sound
                        });
                        // Auto-close after 5 seconds for non-error notifications
                        if (notification.type !== 'error') {
                            setTimeout(function () { return browserNotification_1.close(); }, 5000);
                        }
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.isNotificationTypeEnabled = function (type) {
        switch (type) {
            case 'channel_update':
                return this.settings.channelUpdates;
            case 'playlist_update':
                return this.settings.playlistUpdates;
            case 'info':
            case 'success':
            case 'warning':
            case 'error':
                return this.settings.systemNotifications;
            default:
                return true;
        }
    };
    NotificationService.prototype.saveNotifications = function () {
        if (typeof window === 'undefined')
            return;
        try {
            // Keep only last 50 notifications
            var notificationsToStore = this.notifications.slice(-50);
            localStorage.setItem("streamverse_notifications", JSON.stringify(notificationsToStore));
        }
        catch (error) {
            console.warn("Failed to save notifications:", error);
        }
    };
    NotificationService.prototype.getNotifications = function () {
        if (typeof window === 'undefined')
            return [];
        return __spreadArray([], this.notifications, true).reverse(); // Most recent first
    };
    NotificationService.prototype.clearNotifications = function () {
        if (typeof window === 'undefined')
            return;
        this.notifications = [];
        localStorage.removeItem("streamverse_notifications");
    };
    NotificationService.prototype.markAsRead = function (notificationId) {
        if (typeof window === 'undefined')
            return;
        var notification = this.notifications.find(function (n) { return n.id === notificationId; });
        if (notification) {
            notification.data = __assign(__assign({}, notification.data), { read: true });
            this.saveNotifications();
        }
    };
    // Predefined notification methods
    NotificationService.prototype.notifyChannelUpdate = function (channelName, playlistName) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.showNotification({
                            type: 'channel_update',
                            title: 'Nouvelle chaîne disponible',
                            body: "".concat(channelName, " a \u00E9t\u00E9 ajout\u00E9e \u00E0 ").concat(playlistName),
                            icon: "/icons/icon-192x192.png",
                            tag: 'channel_update',
                            data: { channelName: channelName, playlistName: playlistName }
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.notifyPlaylistUpdate = function (playlistName, channelCount) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.showNotification({
                            type: 'playlist_update',
                            title: 'Playlist mise à jour',
                            body: "".concat(playlistName, " contient maintenant ").concat(channelCount, " cha\u00EEnes"),
                            icon: "/icons/icon-192x192.png",
                            tag: 'playlist_update',
                            data: { playlistName: playlistName, channelCount: channelCount }
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.notifyFavoriteChannelUpdate = function (channelName) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.settings.favoriteChannelUpdates)
                            return [2 /*return*/];
                        return [4 /*yield*/, this.showNotification({
                                type: 'channel_update',
                                title: 'Chaîne favorite mise à jour',
                                body: "".concat(channelName, " est maintenant disponible"),
                                icon: "/icons/icon-192x192.png",
                                tag: 'favorite_update',
                                data: { channelName: channelName },
                                actions: [
                                    { action: 'play', title: 'Regarder', icon: "/icons/play.png" },
                                    { action: 'dismiss', title: 'Ignorer' }
                                ]
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.notifyError = function (message, details) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.showNotification({
                            type: 'error',
                            title: 'Erreur StreamVerse',
                            body: message,
                            icon: "/icons/icon-192x192.png",
                            tag: 'error',
                            data: { details: details }
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.notifySuccess = function (message, details) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.showNotification({
                            type: 'success',
                            title: 'StreamVerse',
                            body: message,
                            icon: "/icons/icon-192x192.png",
                            tag: 'success',
                            data: { details: details }
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Schedule notifications (for future features)
    NotificationService.prototype.scheduleNotification = function (data, delay) {
        var _this = this;
        if (typeof window === 'undefined')
            return;
        setTimeout(function () {
            _this.showNotification(data);
        }, delay);
    };
    // Check if notifications are supported
    NotificationService.prototype.isSupported = function () {
        return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
    };
    // Get permission status
    NotificationService.prototype.getPermissionStatus = function () {
        return this.permission;
    };
    return NotificationService;
}());
// Create singleton instance
exports.notificationService = new NotificationService();
// React hook for notifications
function useNotifications() {
    return {
        requestPermission: exports.notificationService.requestPermission.bind(exports.notificationService),
        showNotification: exports.notificationService.showNotification.bind(exports.notificationService),
        getSettings: exports.notificationService.getSettings.bind(exports.notificationService),
        updateSettings: exports.notificationService.updateSettings.bind(exports.notificationService),
        getNotifications: exports.notificationService.getNotifications.bind(exports.notificationService),
        clearNotifications: exports.notificationService.clearNotifications.bind(exports.notificationService),
        markAsRead: exports.notificationService.markAsRead.bind(exports.notificationService),
        notifyChannelUpdate: exports.notificationService.notifyChannelUpdate.bind(exports.notificationService),
        notifyPlaylistUpdate: exports.notificationService.notifyPlaylistUpdate.bind(exports.notificationService),
        notifyFavoriteChannelUpdate: exports.notificationService.notifyFavoriteChannelUpdate.bind(exports.notificationService),
        notifyError: exports.notificationService.notifyError.bind(exports.notificationService),
        notifySuccess: exports.notificationService.notifySuccess.bind(exports.notificationService),
        isSupported: exports.notificationService.isSupported.bind(exports.notificationService),
        getPermissionStatus: exports.notificationService.getPermissionStatus.bind(exports.notificationService)
    };
}
exports.useNotifications = useNotifications;
