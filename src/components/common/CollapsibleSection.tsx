/**
 * CollapsibleSection
 *
 * A titled section that starts folded and remembers open or closed on this
 * device (AsyncStorage, per section key, wiped with the user-scoped keys on
 * sign-out). Folded, it shows one summary line so the reader knows what is
 * inside without opening it.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@constants/theme';
import { track } from '@services/analytics';

interface Props {
  /** AsyncStorage key holding '1' (open) or '0' (closed). List it in USER_SCOPED_KEYS. */
  storageKey:   string;
  /** Short name used in the toggle event. */
  name:         string;
  title:        string;
  summary?:     string;
  defaultOpen?: boolean;
  children:     React.ReactNode;
}

export default function CollapsibleSection({ storageKey, name, title, summary, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(storageKey)
      .then(v => { if (!cancelled) setOpen(v === null ? defaultOpen : v === '1'); })
      .catch(() => { if (!cancelled) setOpen(defaultOpen); });
    return () => { cancelled = true; };
  }, [storageKey, defaultOpen]);

  const toggle = () => {
    const next = !(open ?? defaultOpen);
    setOpen(next);
    track('today_section_toggled', { section: name, open: next });
    AsyncStorage.setItem(storageKey, next ? '1' : '0').catch(() => {});
  };

  const isOpen = open ?? defaultOpen;

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={`${title}, ${isOpen ? 'open' : 'closed'}`}
      >
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {!isOpen && !!summary && <Text style={styles.summary}>{summary}</Text>}
        </View>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text.tertiary} />
      </TouchableOpacity>
      {isOpen && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing[7],
    gap:          spacing[3],
  },
  // Flat, like the other section labels: the chevron and the summary line
  // are what say it opens.
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing[3.5],
    paddingVertical: spacing[1],
    minHeight:       44,
  },
  headerText: {
    flex: 1,
    gap:  spacing[1],
  },
  title: {
    ...typography.label,
  },
  summary: {
    color:      colors.text.secondary,
    fontSize:   14,
    lineHeight: 20,
  },
  body: {
    gap: spacing[3],
  },
});
