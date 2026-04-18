class Song {}
void main() {
  try {
    List<dynamic> data = [{'hello': 'world'}];
    List<Song> cached = data.map((json) => Song()).toList();
    print("Success");
  } catch (e) {
    print("Error: $e");
  }
}
