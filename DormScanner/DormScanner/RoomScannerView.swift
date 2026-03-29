import SwiftUI
import RoomPlan

struct RoomCaptureRepresentable: UIViewRepresentable {
    let controller: RoomCaptureController

    func makeUIView(context: Context) -> RoomCaptureView {
        controller.setupCaptureView()
    }

    func updateUIView(_ uiView: RoomCaptureView, context: Context) {}
}

struct RoomScannerView: View {
    let dormName: String
    let roomNumber: String
    let onScanComplete: (DormRoom) -> Void

    @StateObject private var controller = RoomCaptureController()
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    @State private var showingResults = false
    @State private var isSaving = false

    var body: some View {
        ZStack {
            RoomCaptureRepresentable(controller: controller)
                .ignoresSafeArea()

            VStack {
                // Header overlay
                HStack {
                    VStack(alignment: .leading) {
                        Text(dormName)
                            .font(.headline)
                            .foregroundStyle(.white)
                        Text("Room \(roomNumber)")
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.8))
                    }
                    .padding(12)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))

                    Spacer()
                }
                .padding()

                Spacer()

                // Bottom controls
                HStack(spacing: 20) {
                    Button("Cancel") {
                        controller.stopSession()
                        dismiss()
                    }
                    .buttonStyle(.bordered)
                    .tint(.red)

                    Spacer()

                    if controller.isScanning {
                        Button("Done Scanning") {
                            controller.stopSession()
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.green)
                    }
                }
                .padding()
                .background(.ultraThinMaterial)
            }
        }
        .onAppear {
            controller.startSession()
        }
        .onChange(of: controller.scanResult != nil) { _, hasResult in
            if hasResult {
                showingResults = true
            }
        }
        .sheet(isPresented: $showingResults) {
            ScanResultsSheet(
                controller: controller,
                dormName: dormName,
                roomNumber: roomNumber,
                isSaving: $isSaving
            ) { room in
                onScanComplete(room)
                dismiss()
            }
        }
        .alert("Scan Error", isPresented: .init(
            get: { controller.errorMessage != nil },
            set: { if !$0 { controller.errorMessage = nil } }
        )) {
            Button("OK") { dismiss() }
        } message: {
            Text(controller.errorMessage ?? "Unknown error")
        }
    }
}

struct ScanResultsSheet: View {
    let controller: RoomCaptureController
    let dormName: String
    let roomNumber: String
    @Binding var isSaving: Bool
    let onSave: (DormRoom) -> Void

    @State private var notes = ""

    private var result: RoomScanResult? { controller.scanResult }

    var body: some View {
        NavigationStack {
            Form {
                Section("Room Info") {
                    LabeledContent("Dorm", value: dormName)
                    LabeledContent("Room", value: roomNumber)
                }

                if let result {
                    Section("Dimensions") {
                        if let l = result.length, let w = result.width {
                            LabeledContent("Length", value: String(format: "%.1f ft", l * 3.28084))
                            LabeledContent("Width", value: String(format: "%.1f ft", w * 3.28084))
                        }
                        if let h = result.height {
                            LabeledContent("Height", value: String(format: "%.1f ft", h * 3.28084))
                        }
                        if let area = result.floorArea {
                            LabeledContent("Floor Area", value: String(format: "%.0f sq ft", area * 10.7639))
                        }
                    }

                    Section("Detected Features") {
                        LabeledContent("Walls", value: "\(result.wallCount)")
                        LabeledContent("Windows", value: "\(result.windowCount)")
                        LabeledContent("Doors", value: "\(result.doorCount)")
                        if !result.objectsSummary.isEmpty {
                            LabeledContent("Objects", value: result.objectsSummary)
                        }
                    }
                }

                Section("Notes") {
                    TextField("Add any notes about this room...", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle("Scan Results")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Discard") {
                        onSave(createRoom(export: false))
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            isSaving = true
                            let room = await saveWithExport()
                            isSaving = false
                            onSave(room)
                        }
                    }
                    .disabled(isSaving)
                }
            }
        }
        .interactiveDismissDisabled()
    }

    private func createRoom(export: Bool) -> DormRoom {
        let room = DormRoom(
            dormName: dormName,
            roomNumber: roomNumber,
            roomLength: result?.length,
            roomWidth: result?.width,
            roomHeight: result?.height,
            floorArea: result?.floorArea,
            wallCount: result?.wallCount ?? 0,
            windowCount: result?.windowCount ?? 0,
            doorCount: result?.doorCount ?? 0,
            objectsSummary: result?.objectsSummary ?? "",
            notes: notes
        )
        return room
    }

    private func saveWithExport() async -> DormRoom {
        let room = createRoom(export: true)

        // Export USDZ file
        let documentsDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let scansDir = documentsDir.appendingPathComponent("Scans", isDirectory: true)
        try? FileManager.default.createDirectory(at: scansDir, withIntermediateDirectories: true)

        let filename = "\(dormName)_\(roomNumber)_\(room.id.uuidString.prefix(8))"
        let usdzURL = scansDir.appendingPathComponent("\(filename).usdz")

        let exported = await controller.exportUSDZ(to: usdzURL)
        if exported {
            room.usdzFilePath = "Scans/\(filename).usdz"
        }

        return room
    }
}
