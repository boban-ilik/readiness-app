/**
 * LifeEventTagger
 *
 * A "+ Tag my day" button that opens a bottom-sheet modal letting users
 * mark contextual events (alcohol, illness, travel, etc.) for today.
 * Tagged events appear as chips below the button and feed into the AI coach context.
 */

import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  EVENT_TYPES,
  tagEvent,
  removeEvent,
  type EventType,
  type LifeEvent,
} from '@services/lifeEvents';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';

interface Props {
  events:    LifeEvent[];
  onTagged:  (events: LifeEvent[]) => void;   // called with updated list after add/remove
}

export default function LifeEventTagger({ events, onTagged }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<EventType | null>(null);
  const [notes,        setNotes]        = useState('');
  const [isSaving,     setIsSaving]     = useState(false);

  // Today's events only (for the chip display)
  const today = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.date === today);

  async function handleSave() {
    if (!selectedType || isSaving) return;
    setIsSaving(true);
    try {
      const newEvent = await tagEvent(selectedType, notes.trim() || undefined);
      if (newEvent) {
        onTagged([newEvent, ...events]);
      }
      setModalVisible(false);
      setSelectedType(null);
      setNotes('');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove(id: string) {
    await removeEvent(id);
    onTagged(events.filter(e => e.id !== id));
  }

  const meta = EVENT_TYPES.find(e => e.type === selectedType);

  return (
    <View style={styles.wrapper}>
      {/* Tag button + existing chips */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.tagBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.tagBtnPlus}>+</Text>
          <Text style={styles.tagBtnLabel}>Tag my day</Text>
        </TouchableOpacity>

        {todayEvents.map(e => {
          const m = EVENT_TYPES.find(x => x.type === e.event_type);
          return (
            <TouchableOpacity
              key={e.id}
              style={styles.chip}
              onLongPress={() => handleRemove(e.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipEmoji}>{m?.emoji ?? '📌'}</Text>
              <Text style={styles.chipLabel} numberOfLines={1}>{m?.label ?? e.event_type}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {todayEvents.length > 0 && (
        <Text style={styles.hint}>
          ✦ Your coach will factor these in · long-press a tag to remove it
        </Text>
      )}

      {/* Bottom-sheet modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>What's affecting you today?</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetSub}>
              Tags are sent to your AI coach so it can explain score changes and
              give you more relevant advice. Only you can see them.
            </Text>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Event type grid */}
              <View style={styles.grid}>
                {EVENT_TYPES.map(e => (
                  <TouchableOpacity
                    key={e.type}
                    style={[
                      styles.gridItem,
                      selectedType === e.type && styles.gridItemSelected,
                    ]}
                    onPress={() => setSelectedType(
                      selectedType === e.type ? null : e.type
                    )}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.gridEmoji}>{e.emoji}</Text>
                    <Text style={[
                      styles.gridLabel,
                      selectedType === e.type && styles.gridLabelSelected,
                    ]}>
                      {e.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Optional notes */}
              {selectedType && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Add a note (optional)</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder={`E.g. "${meta?.label}" — anything specific?`}
                    placeholderTextColor={colors.text.tertiary}
                    maxLength={120}
                    multiline
                  />
                </View>
              )}
            </ScrollView>

            {/* Save button */}
            <View style={styles.sheetFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, (!selectedType || isSaving) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!selectedType || isSaving}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>
                  {isSaving ? 'Saving…' : selectedType ? `Tag as ${meta?.emoji} ${meta?.label}` : 'Select a tag first'}
                </Text>
              </TouchableOpacity>
            </View>

          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing[2] },

  row: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing[2],
    alignItems:    'center',
  },

  tagBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical:   spacing[2],
    borderRadius:      radius.full ?? 99,
    borderWidth:       1,
    borderStyle:       'dashed' as const,
    borderColor:       colors.border.subtle,
  },
  tagBtnPlus: {
    fontSize:   fontSize.base,
    color:      colors.text.tertiary,
    fontWeight: fontWeight.medium,
  },
  tagBtnLabel: {
    fontSize: fontSize.xs,
    color:    colors.text.tertiary,
  },

  chip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: spacing[3],
    paddingVertical:   spacing[1],
    borderRadius:      radius.full ?? 99,
    backgroundColor:   colors.bg.elevated,
    borderWidth:       1,
    borderColor:       colors.border.subtle,
    maxWidth:          140,
  },
  chipEmoji: { fontSize: 12 },
  chipLabel: {
    fontSize: fontSize.xs,
    color:    colors.text.secondary,
  },

  hint: {
    fontSize:  10,
    color:     colors.text.tertiary,
    opacity:   0.6,
    marginLeft: spacing[1],
  },

  // Sheet
  sheet: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  sheetHeader: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: spacing[5],
    paddingTop:        spacing[5],
    paddingBottom:     spacing[2],
  },
  sheetTitle: {
    fontSize:   fontSize.lg,
    fontWeight: fontWeight.semiBold,
    color:      colors.text.primary,
  },
  sheetClose: {
    fontSize: fontSize.base,
    color:    colors.text.secondary,
  },
  sheetSub: {
    fontSize:          fontSize.xs,
    color:             colors.text.tertiary,
    paddingHorizontal: spacing[5],
    lineHeight:        18,
    marginBottom:      spacing[4],
  },
  sheetScroll:        { flex: 1 },
  sheetScrollContent: {
    paddingHorizontal: spacing[5],
    paddingBottom:     spacing[4],
    gap:               spacing[5],
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing[3],
  },
  gridItem: {
    width:           '46%',
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing[2],
    paddingVertical:   spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    backgroundColor: colors.bg.elevated,
  },
  gridItemSelected: {
    borderColor:     colors.text.accent,
    backgroundColor: colors.text.accent + '15',
  },
  gridEmoji: { fontSize: 20 },
  gridLabel: {
    flex:     1,
    fontSize: fontSize.xs,
    color:    colors.text.secondary,
  },
  gridLabelSelected: {
    color:      colors.text.accent,
    fontWeight: fontWeight.medium,
  },

  // Notes
  notesContainer: { gap: spacing[2] },
  notesLabel: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.medium,
    color:      colors.text.secondary,
  },
  notesInput: {
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    padding:         spacing[3],
    fontSize:        fontSize.sm,
    color:           colors.text.primary,
    minHeight:       80,
    textAlignVertical: 'top',
  },

  // Footer
  sheetFooter: {
    paddingHorizontal: spacing[5],
    paddingVertical:   spacing[4],
    borderTopWidth:    1,
    borderTopColor:    colors.border.subtle,
  },
  saveBtn: {
    backgroundColor: colors.text.accent,
    borderRadius:    radius.md,
    paddingVertical: spacing[4],
    alignItems:      'center',
  },
  saveBtnDisabled: {
    backgroundColor: colors.bg.elevated,
  },
  saveBtnText: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color:      colors.text.primary,
  },
});
