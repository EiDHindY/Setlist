import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';

void main() {
  test('Path test', () {
    try {
      final sPath = Path();
      sPath.moveTo(30, 80);
      sPath.arcToPoint(const Offset(50, 100), radius: const Radius.circular(20), clockwise: false);
      sPath.arcToPoint(const Offset(70, 80), radius: const Radius.circular(20), clockwise: false);
      sPath.arcToPoint(const Offset(50, 60), radius: const Radius.circular(20), clockwise: false);
      sPath.arcToPoint(const Offset(34, 44), radius: const Radius.circular(16), clockwise: true);
      sPath.arcToPoint(const Offset(50, 28), radius: const Radius.circular(16), clockwise: true);
      sPath.arcToPoint(const Offset(66, 44), radius: const Radius.circular(16), clockwise: true);

      final metrics = sPath.computeMetrics().toList();
      print('Metrics length: ${metrics.length}');
      
      final StaffPath = Path();
      StaffPath.moveTo(-40, 40);
      StaffPath.quadraticBezierTo(50, 35, 140, 40);
      print('Staff length: ${StaffPath.computeMetrics().toList().length}');
    } catch(e, st) {
      print('Error: $e\n$st');
    }
  });
}
