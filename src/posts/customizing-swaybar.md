---
title: 'Customizing the Swaybar: Battery and Volume from Scratch'
description: 'How I built a minimal, fully understood swaybar status line with battery status, volume control, and mute detection — no plugins required.'
date: '2025-03-06'
tags: ['linux', 'sway', 'wayland', 'terminal', 'dotfiles']
readingTime: '5 min read'
---

One of the things I love most about my current setup is that I know exactly what every process is doing and why it's running. When I started customizing my swaybar, I wanted the same principle to apply — no status bar plugins I don't understand, no external dependencies I can't explain. Just shell commands I wrote myself.

This post walks through how I built a custom swaybar status line with battery percentage, charging status, volume level, and mute detection.

## Dependencies

Before anything else, you'll need PipeWire running for audio support. If you're on a minimal install like I am, these packages won't be there by default:

```bash
sudo apt install pipewire pipewire-pulse wireplumber alsa-utils pulseaudio-utils
```

A quick breakdown of what each one does:

- **pipewire** - The core audio server
- **pipewire-pulse** - A compatibility layer so apps built for PulseAudio work with PipeWire
- **wireplumber** - The session manager that routes audio to the right hardware
- **alsa-utils** - Low level tools for interacting with your audio hardware directly
- **pulseaudio-utils** - Gives you `pactl`, the command line tool for controlling volume

Since I manage my own process lifecycle through Sway rather than systemd, I also mask the systemd units so there's no double-launching:

```bash
systemctl --user mask pipewire pipewire-pulse wireplumber
systemctl --user mask pipewire.socket pipewire-pulse.socket
```

And start everything from my Sway config in the correct order:

```
exec pipewire
exec sh -c "sleep 1 && pipewire-pulse"
exec sh -c "sleep 2 && wireplumber"
```

The `sh -c` wrapper is necessary because Sway's `exec` doesn't invoke a shell — it runs binaries directly, so shell operators like `&&` won't work without it.

## Building the Status Command

The swaybar `status_command` runs a loop that echoes a string every second. That string becomes what you see in the bar. Here's the full script:

```bash
status_command while true;                                                          \
  do                                                                                \
    battery_percent=$(cat /sys/class/power_supply/BAT0/capacity);                  \
    battery_status=$(cat /sys/class/power_supply/BAT0/status);                     \
    date=$(date +'%Y-%m-%d %X');                                                    \
    volume_raw=$(pactl get-sink-volume '@DEFAULT_SINK@');                           \
    regex_ex="\d+(?=%)";                                                            \
    volume_level=$(echo $volume_raw | grep -oP $regex_ex | head -1);               \
    mute_raw=$(pactl get-sink-mute '@DEFAULT_SINK@');                               \
    volume_display=$([ "$mute_raw" = "Mute: yes" ] && echo "MUTED" || echo "Vol $volume_level%"); \
    message="$volume_display | $battery_status $battery_percent% | $date";         \
    echo $message;                                                                  \
    sleep 1;                                                                        \
  done
```

## Breaking It Down

**Battery** is straightforward — the kernel exposes battery information as plain text files under `/sys/class/power_supply/`. Reading them is just `cat`.

```bash
battery_percent=$(cat /sys/class/power_supply/BAT0/capacity)
battery_status=$(cat /sys/class/power_supply/BAT0/status)
```

`capacity` gives you a number like `82`. `status` gives you `Charging`, `Discharging`, or `Full`.

**Volume** requires a bit more work. `pactl get-sink-volume` returns a verbose string with decibels, balance, and both channels. We only want the percentage:

```bash
volume_raw=$(pactl get-sink-volume '@DEFAULT_SINK@')
volume_level=$(echo $volume_raw | grep -oP '\d+(?=%)' | head -1)
```

The `@DEFAULT_SINK@` needs single quotes — without them the shell may try to interpret the `@` symbols. The grep pattern uses a lookahead (`(?=%)`) to match digits immediately followed by a `%` sign without including the `%` in the result. `head -1` takes only the first match since both audio channels return the same value.

**Mute detection** uses a ternary-style one liner rather than a full `if/then/fi` block, which doesn't play nicely inside an inline status command:

```bash
mute_raw=$(pactl get-sink-mute '@DEFAULT_SINK@')
volume_display=$([ "$mute_raw" = "Mute: yes" ] && echo "MUTED" || echo "Vol $volume_level%")
```

If muted, display `MUTED`. Otherwise display `Vol 72%` or whatever the current level is.

## Volume Keybindings

To control volume from the keyboard, add these to your Sway config using the `wpctl` tool which respects a 100% ceiling by default:

```
bindsym XF86AudioRaiseVolume exec wpctl set-volume -l 1.0 @DEFAULT_AUDIO_SINK@ 5%+
bindsym XF86AudioLowerVolume exec wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%-
bindsym XF86AudioMute exec wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle
```

The `XF86` key names are Linux's standardized names for multimedia keys — your physical volume buttons on the keyboard map to these automatically.

## The Result

A status bar that shows exactly what I need, built entirely from commands I understand:

```
Vol 72% | Discharging 81% | 2025-03-06 23:58:01
```

Or when muted:

```
MUTED | Charging 94% | 2025-03-06 23:58:01
```

No plugins. No dependencies beyond what's needed for audio to work anyway. Every line of that script I can explain from memory.

That's the goal.

---

*Still up at 2am tweaking configs. No regrets. 🚀*
