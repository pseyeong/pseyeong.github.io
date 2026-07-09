import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { trips } from '../data/trippiData';

export default function TripScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.sectionTitle}>여행</Text>
            <Text style={styles.sectionSubtitle}>루트와 일정, 다 같이 정리해보세요.</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>여행 추가</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>진행 중 여행</Text>
          <Text style={styles.featureTrip}>서울 → 제주 3박 4일</Text>
          <View style={styles.featureMetaRow}>
            <Text style={styles.featureMeta}>D-5</Text>
            <Text style={styles.featureMeta}>20개 일정</Text>
          </View>
        </View>

        {trips.map((trip) => (
          <TouchableOpacity
            key={trip.id}
            style={styles.card}
            onPress={() => navigation.navigate('TripDetail', { tripId: trip.id })}
          >
            <Text style={styles.cardTitle}>{trip.title}</Text>
            <Text style={styles.cardMeta}>{trip.dates} · {trip.daysCount}박 {trip.daysCount - 1}일</Text>
            <Text style={styles.cardText}>{trip.summary}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.mapCard}>
          <Text style={styles.mapTitle}>루트 시각화</Text>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>카카오맵 연동 예정</Text>
          </View>
          <Text style={styles.mapHint}>루트 그림을 추가하면 여행 준비가 더 편해집니다.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4FF',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#111827',
  },
  sectionSubtitle: {
    marginTop: 6,
    color: '#6B7280',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#F9F5FF',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  addButtonText: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  featureCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 22,
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 5,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  featureTrip: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 32,
  },
  featureMetaRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  featureMeta: {
    color: '#EDE9FE',
    fontWeight: '700',
    fontSize: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  card: {
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  cardMeta: {
    marginTop: 10,
    color: '#6B7280',
  },
  cardText: {
    marginTop: 14,
    color: '#4B5563',
    lineHeight: 22,
    fontSize: 14,
  },
  mapCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 4,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  mapPlaceholder: {
    marginTop: 18,
    height: 220,
    borderRadius: 20,
    backgroundColor: '#F4F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  mapPlaceholderText: {
    color: '#7C3AED',
  },
  mapHint: {
    marginTop: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
