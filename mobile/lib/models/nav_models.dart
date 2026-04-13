import 'package:flutter/material.dart';

class NavPoint {
  final int mainIndex;
  final int? subNavIndex;
  final bool isSubNavMode;
  const NavPoint(this.mainIndex, {this.subNavIndex, this.isSubNavMode = false});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is NavPoint &&
          runtimeType == other.runtimeType &&
          mainIndex == other.mainIndex &&
          subNavIndex == other.subNavIndex &&
          isSubNavMode == other.isSubNavMode;

  @override
  int get hashCode => mainIndex.hashCode ^ subNavIndex.hashCode ^ isSubNavMode.hashCode;
}

class SubNavItemData {
  final IconData? icon;
  final Widget Function(bool isSelected)? customIconBuilder;
  final String label;
  
  const SubNavItemData({
    this.icon,
    this.customIconBuilder,
    required this.label,
  });
}
