import SwiftUI

struct ContentView: View {
    var body: some View {
        RoomListView()
    }
}

#Preview {
    ContentView()
        .modelContainer(for: DormRoom.self, inMemory: true)
}
