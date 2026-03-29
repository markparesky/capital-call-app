import SwiftUI
import QuickLook

struct RoomDetailView: View {
    @Bindable var room: DormRoom
    @State private var previewURL: URL?
    @State private var showingShareSheet = false

    var body: some View {
        List {
            Section("Location") {
                LabeledContent("Dorm", value: room.dormName)
                LabeledContent("Room Number", value: room.roomNumber)
                LabeledContent("Scanned", value: room.scanDate.formatted(date: .abbreviated, time: .shortened))
            }

            Section("Dimensions") {
                if let length = room.roomLength {
                    LabeledContent("Length", value: String(format: "%.1f ft (%.2f m)", length * 3.28084, length))
                }
                if let width = room.roomWidth {
                    LabeledContent("Width", value: String(format: "%.1f ft (%.2f m)", width * 3.28084, width))
                }
                if let height = room.roomHeight {
                    LabeledContent("Ceiling Height", value: String(format: "%.1f ft (%.2f m)", height * 3.28084, height))
                }
                if let area = room.floorArea {
                    LabeledContent("Floor Area", value: String(format: "%.0f sq ft (%.1f m²)", area * 10.7639, area))
                }
            }

            Section("Detected Features") {
                LabeledContent("Walls", value: "\(room.wallCount)")
                LabeledContent("Windows", value: "\(room.windowCount)")
                LabeledContent("Doors", value: "\(room.doorCount)")
                if !room.objectsSummary.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Objects")
                            .foregroundStyle(.secondary)
                        Text(room.objectsSummary)
                    }
                }
            }

            if room.usdzFilePath != nil {
                Section("3D Model") {
                    Button {
                        openUSDAPreview()
                    } label: {
                        Label("View 3D Model", systemImage: "cube")
                    }

                    Button {
                        shareUSDZ()
                    } label: {
                        Label("Share 3D Model", systemImage: "square.and.arrow.up")
                    }
                }
            }

            Section("Notes") {
                TextField("Add notes...", text: $room.notes, axis: .vertical)
                    .lineLimit(3...10)
            }
        }
        .navigationTitle(room.displayName)
        .navigationBarTitleDisplayMode(.inline)
        .quickLookPreview($previewURL)
        .sheet(isPresented: $showingShareSheet) {
            if let url = usdzFileURL {
                ShareSheet(items: [url])
            }
        }
    }

    private var usdzFileURL: URL? {
        guard let path = room.usdzFilePath else { return nil }
        let documentsDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let url = documentsDir.appendingPathComponent(path)
        return FileManager.default.fileExists(atPath: url.path()) ? url : nil
    }

    private func openUSDAPreview() {
        previewURL = usdzFileURL
    }

    private func shareUSDZ() {
        if usdzFileURL != nil {
            showingShareSheet = true
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
