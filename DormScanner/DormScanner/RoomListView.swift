import SwiftUI
import SwiftData

struct RoomListView: View {
    @Query(sort: \DormRoom.scanDate, order: .reverse) private var rooms: [DormRoom]
    @State private var searchText = ""
    @State private var showingNewScan = false
    @Environment(\.modelContext) private var modelContext

    var filteredRooms: [DormRoom] {
        if searchText.isEmpty { return rooms }
        return rooms.filter {
            $0.dormName.localizedCaseInsensitiveContains(searchText) ||
            $0.roomNumber.localizedCaseInsensitiveContains(searchText)
        }
    }

    var groupedRooms: [(String, [DormRoom])] {
        let grouped = Dictionary(grouping: filteredRooms) { $0.dormName }
        return grouped.sorted { $0.key < $1.key }
    }

    var body: some View {
        NavigationStack {
            Group {
                if rooms.isEmpty {
                    ContentUnavailableView {
                        Label("No Rooms Scanned", systemImage: "building.2")
                    } description: {
                        Text("Tap the + button to scan your first dorm room.")
                    } actions: {
                        Button("Scan a Room") {
                            showingNewScan = true
                        }
                        .buttonStyle(.borderedProminent)
                    }
                } else {
                    List {
                        ForEach(groupedRooms, id: \.0) { dormName, dormRooms in
                            Section(dormName) {
                                ForEach(dormRooms) { room in
                                    NavigationLink(value: room) {
                                        RoomRowView(room: room)
                                    }
                                }
                                .onDelete { indexSet in
                                    deleteRooms(dormRooms: dormRooms, at: indexSet)
                                }
                            }
                        }
                    }
                    .searchable(text: $searchText, prompt: "Search dorms or rooms")
                }
            }
            .navigationTitle("Dorm Rooms")
            .navigationDestination(for: DormRoom.self) { room in
                RoomDetailView(room: room)
            }
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingNewScan = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingNewScan) {
                NewScanView()
            }
        }
    }

    private func deleteRooms(dormRooms: [DormRoom], at offsets: IndexSet) {
        for index in offsets {
            let room = dormRooms[index]
            // Clean up exported files
            if let usdzPath = room.usdzFilePath {
                let documentsDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
                let fileURL = documentsDir.appendingPathComponent(usdzPath)
                try? FileManager.default.removeItem(at: fileURL)
            }
            modelContext.delete(room)
        }
    }
}

struct RoomRowView: View {
    let room: DormRoom

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Room \(room.roomNumber)")
                .font(.headline)

            HStack {
                Label(room.dimensionsText, systemImage: "ruler")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: 12) {
                if room.wallCount > 0 {
                    Label("\(room.wallCount) walls", systemImage: "square.split.2x2")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                if room.windowCount > 0 {
                    Label("\(room.windowCount) windows", systemImage: "window.vertical.open")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                if room.doorCount > 0 {
                    Label("\(room.doorCount) doors", systemImage: "door.left.hand.open")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            Text(room.scanDate, style: .date)
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    RoomListView()
        .modelContainer(for: DormRoom.self, inMemory: true)
}
