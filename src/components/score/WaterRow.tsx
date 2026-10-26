/**
 * WaterRow
 *
 * Today's water from Apple Health against the user's target, and one button
 * that adds a bottle (0.5 l, or 16 fl oz). Each tap waits 5 seconds before it
 * is written to Health so "Undo" can take it back without deleting anything
 * there; leaving the app writes pending taps straight away.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState, Alert } from 'react-native';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';
import {
  fetchTodayWaterLitres, saveWaterLitres, loadWaterPrefs, requestWaterPermission, hasAskedWaterPermission,
} from '@services/water';
import { TAP_LITRES, formatWater, waterProgress, type WaterUnit } from '@utils/water';
import { track } from '@services/analytics';
import { isGarminConnected, fetchGarminWaterToday } from '@services/garmin';

const UNDO_MS = 5_000;

interface Pending { id: number; litres: number; at: Date; timer: ReturnType<typeof setTimeout> }

/** @param reloadKey changes whenever Today refreshes */
export default function WaterRow({ reloadKey }: { reloadKey: unknown }) {
  const [saved,   setSaved]   = useState(0);
  const [pending, setPending] = useState<Pending[]>([]);
  const [unit,    setUnit]    = useState<WaterUnit>('l');
  const [target,  setTarget]  = useState(2.5);
  const pendingRef = useRef<Pending[]>([]);
  const nextId     = useRef(1);

  const setPendingBoth = (p: Pending[]) => { pendingRef.current = p; setPending(p); };

  const reload = useCallback(async () => {
    const prefs = await loadWaterPrefs();
    setUnit(prefs.unit);
    setTarget(prefs.targetLitres);
    let total = (await hasAskedWaterPermission()) ? await fetchTodayWaterLitres() : 0;
    // Water logged on a Garmin watch or in Garmin Connect never reaches Apple
    // Health; with Garmin connected the larger of the two totals is today's.
    if (await isGarminConnected()) {
      const garmin = await fetchGarminWaterToday().catch(() => null);
      if (garmin != null && garmin > total) total = garmin;
    }
    setSaved(total);
  }, []);

  useEffect(() => { reload(); }, [reload, reloadKey]);

  const write = useCallback(async (p: Pending) => {
    clearTimeout(p.timer);
    setPendingBoth(pendingRef.current.filter(x => x.id !== p.id));
    try {
      await saveWaterLitres(p.litres, p.at);
      setSaved(s => s + p.litres);
      track('water_logged', { unit });
    } catch {
      Alert.alert(
        "Couldn't save to Apple Health",
        'Allow Readiness to write Water in the Health app: Settings > Health > Data Access & Devices > Readiness.',
      );
    }
  }, [unit]);

  // Leaving the app writes whatever is still waiting for its undo window.
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => {
      if (s !== 'active') pendingRef.current.forEach(p => { write(p); });
    });
    return () => sub.remove();
  }, [write]);

  async function add() {
    if (!(await hasAskedWaterPermission())) {
      const ok = await requestWaterPermission();
      if (!ok) return;
      setSaved(await fetchTodayWaterLitres());
    }
    const litres = TAP_LITRES[unit];
    const id = nextId.current++;
    const p: Pending = { id, litres, at: new Date(), timer: setTimeout(() => {
      const still = pendingRef.current.find(x => x.id === id);
      if (still) write(still);
    }, UNDO_MS) };
    setPendingBoth([...pendingRef.current, p]);
  }

  function undo() {
    const last = pendingRef.current[pendingRef.current.length - 1];
    if (!last) return;
    clearTimeout(last.timer);
    setPendingBoth(pendingRef.current.slice(0, -1));
    track('water_undone');
  }

  const total    = saved + pending.reduce((s, p) => s + p.litres, 0);
  const progress = waterProgress(total, target);
  const lastPending = pending[pending.length - 1];

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.textBlock}>
          <Text style={styles.label}>💧 Water today</Text>
          <Text style={styles.amount}>
            {formatWater(total, unit)}
            <Text style={styles.target}>{`  of ${formatWater(target, unit)}`}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={add}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Add ${formatWater(TAP_LITRES[unit], unit)} of water`}
        >
          <Text style={styles.addText}>+ {formatWater(TAP_LITRES[unit], unit)}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      {lastPending && (
        <View style={styles.undoRow}>
          <Text style={styles.undoText}>Added {formatWater(lastPending.litres, unit)}</Text>
          <TouchableOpacity onPress={undo} hitSlop={8} accessibilityRole="button">
            <Text style={styles.undoBtn}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Same shape as the Performance Fuel (Nutrition) card above it: full section
  // width, xl corners, subtle border.
  card: {
    borderRadius:    radius.xl,
    backgroundColor: colors.bg.tertiary,
    padding:         spacing[5],
    gap:             spacing[3],
    borderWidth:     1,
    borderColor:     colors.border.subtle,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            spacing[3],
  },
  textBlock: { flexShrink: 1 },
  label: {
    fontSize:     fontSize.sm,
    color:        colors.text.secondary,
    marginBottom: 2,
  },
  amount: {
    fontSize:   fontSize.lg,
    fontWeight: fontWeight.semiBold,
    color:      colors.text.primary,
  },
  target: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.regular,
    color:      colors.text.tertiary,
  },
  addBtn: {
    paddingVertical:   spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius:      radius.full,
    backgroundColor:   colors.info,
  },
  addText: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color:      colors.text.primary,
  },
  track: {
    height:          6,
    borderRadius:    3,
    backgroundColor: colors.bg.elevated,
    overflow:        'hidden',
  },
  fill: {
    height:          6,
    borderRadius:    3,
    backgroundColor: colors.info,
  },
  undoRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  undoText: {
    fontSize: fontSize.sm,
    color:    colors.text.secondary,
  },
  undoBtn: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color:      colors.amber[400],
  },
});
