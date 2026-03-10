// components/bento/BentoGrid.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BentoCard, BentoItemProps } from './BentoCard';

interface Props {
  items: BentoItemProps[];
  isDesktop: boolean;
}

export const BentoGrid = ({ items, isDesktop }: Props) => {
  return (
    <View style={styles.grid}>
      {items.map((item, index) => (
        <BentoCard 
          key={item.title} 
          index={index} 
          item={item} 
          isDesktop={isDesktop} 
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 40,
  },
});