"""Presentation for the game chooser; existing buttons retain their navigation IDs."""
import re
from html import escape

# Each miniature suggests the actual interaction, using the same stroke language.
GAMES = {
    'mix': ('A bit of everything', '<rect x="3" y="3" width="6" height="6" rx="1"/><circle cx="17" cy="6" r="3"/><path d="m3 20 3-7 3 7Z M14 14l6 6m0-6-6 6"/>'),
    'view3d': ('Turn it in your mind', '<path d="m12 2 9 5v10l-9 5-9-5V7Zm0 10 9-5M12 12 3 7m9 5v10M7 4l10 6"/>'),
    'balance': ('Find an even split', '<path d="M5 5c-4 4-4 10 0 14m14-14c4 4 4 10 0 14M12 2v20M4 12h16"/>'),
    'motion': ('Look. Remember. Trace.', '<path d="M3 17c3-16 6 9 10-5s6-6 8-8"/><circle cx="3" cy="17" r="1"/><circle cx="21" cy="4" r="1"/>'),
    'perspective': ('Find the vanishing point', '<path d="m2 3 10 9L22 3M2 21l10-9 10 9M2 12h20"/><circle cx="12" cy="12" r="3"/>'),
    'proportion': ('Measure with your eye', '<rect x="3" y="6" width="18" height="14" rx="1"/><path d="M3 13h7V6m8 11h3v3"/>'),
    'rhythm': ('Catch the beat', '<path d="M3 10v4m5-8v12m4-16v20m5-16v12m4-8v4"/>'),
    'angle': ('Feel the degrees', '<path d="M3 3v18h18M3 21 19 5M3 13a8 8 0 0 1 6 2"/>'),
    'memory': ('Hold a colour in mind', '<circle cx="10" cy="10" r="7"/><circle cx="15" cy="15" r="7" stroke-dasharray="2 3"/>'),
    'time': ('Count on your instinct', '<circle cx="12" cy="13" r="8"/><path d="M12 8v5l3 2M9 2h6m-3 0v3M19 5l2 2"/>'),
    'timeline': ('Place it in history', '<path d="M3 5h18M3 19h18M7 2v6m10 8v6M7 5v8h10v6"/><circle cx="7" cy="13" r="2"/>'),
    'duration': ('Put time in perspective', '<path d="M6 2h12M6 22h12M7 2c0 6 2 7 5 10-3 3-5 4-5 10M17 2c0 6-2 7-5 10 3 3 5 4 5 10M9 18h6"/>'),
}

def icon(paths):
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>'

def enhance_menu(navigation):
    def tile(match):
        opening, game, label = match.groups()
        subtitle, paths = GAMES[game]
        return opening + '<span class="game-option-icon">' + icon(paths) + '</span><span class="game-option-copy"><strong>' + label + '</strong><small>' + escape(subtitle) + '</small></span></button>'
    navigation = re.sub(r'(<button[^>]*data-mini="([^"]+)"[^>]*>)(.*?)</button>', tile, navigation)
    navigation = navigation.replace('>Daily Five</button>', '><span class="daily-art" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="daily-copy"><strong>Daily Five</strong><small>One day. Five ways to see.</small></span><span class="daily-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18 18 6M6 6h12v12"/></svg></span></button>')
    navigation = navigation.replace('</svg></button><button id="practice"', '</svg><span>History</span></button><button id="practice"')
    navigation = navigation.replace('<span id="practice-label" class="sr-only">Practice</span>', '<span id="practice-label" class="sr-only">Practice</span><div class="game-menu-section"><h3>Pick a skill</h3><span>Play. Repeat. Improve.</span></div>')
    return navigation
