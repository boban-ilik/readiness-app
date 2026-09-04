/**
 * Sources
 *
 * Citations for the health information the app presents, and an honest
 * statement of where a claim is a rule of thumb rather than a finding.
 *
 * Apple rejected 1.0.0 under Guideline 1.4.1 for presenting health
 * information without citations, and requires the citations to be easy for the
 * user to find — hence a first-class screen rather than a link out to the web.
 *
 * Every URL here was checked. If a claim in the app cannot be pointed at a real
 * source, the right fix is to soften the claim, not to add a citation that does
 * not say what we need it to say.
 */

import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius } from '@constants/theme';

// ─── Content ──────────────────────────────────────────────────────────────────

interface Source {
  title: string;
  where: string;
  url:   string;
}

interface Section {
  heading: string;
  /** What the app tells the user, in plain terms. */
  claim:   string;
  sources: Source[];
}

const SECTIONS: Section[] = [
  {
    heading: 'Heart rate variability and recovery',
    claim:
      'Readiness treats heart rate variability as a signal of how recovered your nervous system is, and reads it against your own baseline rather than a population average.',
    sources: [
      {
        title: 'Monitoring Training Adaptation and Recovery Status in Athletes Using Heart Rate Variability via Mobile Devices: A Narrative Review',
        where: 'Sensors, 2025',
        url:   'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12787763/',
      },
      {
        title: 'Heart Rate Variability Applications in Strength and Conditioning: A Narrative Review',
        where: 'Journal of Functional Morphology and Kinesiology, 2024',
        url:   'https://pmc.ncbi.nlm.nih.gov/articles/PMC11204851/',
      },
    ],
  },
  {
    heading: 'How much sleep counts as enough',
    claim:
      'Readiness scores your sleep against a seven hour target. That figure comes from the joint consensus of the American Academy of Sleep Medicine and the Sleep Research Society, which recommends seven or more hours for adults and sets no upper limit.',
    sources: [
      {
        title: 'Joint Consensus Statement on the Recommended Amount of Sleep for a Healthy Adult',
        where: 'Journal of Clinical Sleep Medicine, 2015',
        url:   'https://jcsm.aasm.org/doi/10.5664/jcsm.4950',
      },
    ],
  },
  {
    heading: 'Alcohol and overnight recovery',
    claim:
      'Readiness suggests skipping alcohol on low days because drinking raises your overnight heart rate and leaves you less recovered. Note that the study below found sleep structure itself stayed stable, so we do not claim alcohol destroys your deep sleep.',
    sources: [
      {
        title: 'The Impact of Alcohol on Sleep Physiology: A Prospective Observational Study on Nocturnal Resting Heart Rate Using Smartwatch Technology',
        where: 'Nutrients, 2025',
        url:   'https://pmc.ncbi.nlm.nih.gov/articles/PMC12073130/',
      },
    ],
  },
];

/** Claims we deliberately present as rules of thumb, not findings. */
const RULES_OF_THUMB = [
  'Hydration targets are scaled from your bodyweight using a common millilitres-per-kilogram rule of thumb. There is no single correct daily volume, and thirst is a reasonable guide.',
  'The deep sleep and REM percentages we show are typical ranges rather than clinical thresholds. Healthy people vary widely, and a single night tells you little.',
  'Nutrition suggestions are general dietary guidance. Readiness does not know what you eat and does not track food.',
];

// ─── Screen ───────────────────────────────────────────────────────────────────

function SourceLink({ source }: { source: Source }) {
  return (
    <TouchableOpacity
      style={styles.sourceRow}
      onPress={() => Linking.openURL(source.url).catch(() => {})}
      activeOpacity={0.7}
      accessibilityRole="link"
      accessibilityLabel={`${source.title}. Opens in your browser.`}
    >
      <View style={styles.sourceBody}>
        <Text style={styles.sourceTitle}>{source.title}</Text>
        <Text style={styles.sourceWhere}>{source.where}</Text>
      </View>
      <Text style={styles.sourceChevron}>↗</Text>
    </TouchableOpacity>
  );
}

export default function SourcesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sources</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Readiness is a general wellness and fitness app. It does not diagnose or treat any
          condition, and it is not a substitute for medical advice. Below is where the health
          information in the app comes from.
        </Text>

        {SECTIONS.map(section => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.claim}>{section.claim}</Text>
            {section.sources.map(source => (
              <SourceLink key={source.url} source={source} />
            ))}
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>What we present as rules of thumb</Text>
          <Text style={styles.claim}>
            Some guidance in the app is convention rather than a research finding. We would
            rather say so than dress it up.
          </Text>
          {RULES_OF_THUMB.map(item => (
            <View key={item} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Your own numbers</Text>
          <Text style={styles.claim}>
            When Readiness says your heart rate variability is down 15 ms, that is your data
            measured by your device, not a claim about people in general. Your score is
            calculated on your device from what Apple Health provides.
          </Text>
        </View>

        <Text style={styles.footer}>
          If you have a health concern, or a reading that worries you, speak to a doctor rather
          than to an app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },

  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: spacing[5],
    paddingTop:      spacing[3],
    paddingBottom:   spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  back: {
    color:      colors.text.accent,
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  headerTitle: {
    color:      colors.text.primary,
    fontSize:   fontSize.md,
    fontWeight: fontWeight.semiBold,
  },
  headerSpacer: { width: 52 },

  scroll: {
    paddingHorizontal: spacing[5],
    paddingTop:        spacing[5],
    paddingBottom:     spacing[10],
    gap:               spacing[6],
  },

  intro: {
    color:      colors.text.secondary,
    fontSize:   fontSize.base,
    lineHeight: 23,
  },

  section: { gap: spacing[3] },
  sectionHeading: {
    color:      colors.text.primary,
    fontSize:   fontSize.md,
    fontWeight: fontWeight.semiBold,
  },
  claim: {
    color:      colors.text.secondary,
    fontSize:   fontSize.base,
    lineHeight: 23,
  },

  sourceRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing[3],
    backgroundColor: colors.bg.tertiary,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  sourceBody: { flex: 1, gap: spacing[1] },
  sourceTitle: {
    color:      colors.text.primary,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semiBold,
    lineHeight: 19,
  },
  sourceWhere: {
    color:    colors.text.secondary,
    fontSize: fontSize.xs,
  },
  sourceChevron: {
    color:    colors.text.accent,
    fontSize: fontSize.base,
  },

  bulletRow: {
    flexDirection: 'row',
    gap:           spacing[2],
    alignItems:    'flex-start',
  },
  bullet: {
    color:    colors.text.secondary,
    fontSize: fontSize.base,
    lineHeight: 23,
  },
  bulletText: {
    flex:       1,
    color:      colors.text.secondary,
    fontSize:   fontSize.base,
    lineHeight: 23,
  },

  footer: {
    color:      colors.text.secondary,
    fontSize:   fontSize.sm,
    lineHeight: 20,
    fontStyle:  'italic',
  },
});
