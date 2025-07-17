"use strict";
// Types pour l'application StreamVerse
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quality = exports.Theme = exports.PlaylistStatus = exports.ViewType = void 0;
// Enums
var ViewType;
(function (ViewType) {
    ViewType["HOME"] = "home";
    ViewType["CATEGORIES"] = "categories";
    ViewType["FAVORITES"] = "favorites";
    ViewType["HISTORY"] = "history";
    ViewType["SEARCH"] = "search";
    ViewType["PLAYER"] = "player";
    ViewType["PLAYLISTS"] = "playlists";
    ViewType["ANALYTICS"] = "analytics";
    ViewType["NOTIFICATIONS"] = "notifications";
    ViewType["THEMES"] = "themes";
})(ViewType = exports.ViewType || (exports.ViewType = {}));
var PlaylistStatus;
(function (PlaylistStatus) {
    PlaylistStatus["ACTIVE"] = "active";
    PlaylistStatus["INACTIVE"] = "inactive";
    PlaylistStatus["ERROR"] = "error";
    PlaylistStatus["LOADING"] = "loading";
})(PlaylistStatus = exports.PlaylistStatus || (exports.PlaylistStatus = {}));
var Theme;
(function (Theme) {
    Theme["LIGHT"] = "light";
    Theme["DARK"] = "dark";
    Theme["SYSTEM"] = "system";
})(Theme = exports.Theme || (exports.Theme = {}));
var Quality;
(function (Quality) {
    Quality["AUTO"] = "auto";
    Quality["HIGH"] = "high";
    Quality["MEDIUM"] = "medium";
    Quality["LOW"] = "low";
})(Quality = exports.Quality || (exports.Quality = {}));
