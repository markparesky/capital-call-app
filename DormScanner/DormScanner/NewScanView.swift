import SwiftUI
import RoomPlan

struct NewScanView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @State private var dormName = ""
    @State private var roomNumber = ""
    @State private var showingScanner = false
    @State private var showingUnsupportedAlert = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Dorm Name", text: $dormName)
                        .textInputAutocapitalization(.words)

                    TextField("Room Number", text: $roomNumber)
                        .textInputAutocapitalization(.characters)
                } header: {
                    Text("Room Information")
                } footer: {
                    Text("Enter the dorm building name and room number before scanning.")
                }

                Section {
                    Button {
                        startScan()
                    } label: {
                        HStack {
                            Image(systemName: "camera.viewfinder")
                                .font(.title2)
                            VStack(alignment: .leading) {
                                Text("Start Room Scan")
                                    .font(.headline)
                                Text("Uses LiDAR to capture 3D room data")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.vertical, 8)
                    }
                    .disabled(!isFormValid)
                }

                Section {
                    HStack {
                        Image(systemName: "info.circle")
                            .foregroundStyle(.blue)
                        Text("Requires iPhone/iPad with LiDAR scanner (iPhone 12 Pro and later, iPad Pro 2020 and later)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("New Scan")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .fullScreenCover(isPresented: $showingScanner) {
                RoomScannerView(
                    dormName: dormName.trimmingCharacters(in: .whitespaces),
                    roomNumber: roomNumber.trimmingCharacters(in: .whitespaces)
                ) { room in
                    modelContext.insert(room)
                    dismiss()
                }
            }
            .alert("Device Not Supported", isPresented: $showingUnsupportedAlert) {
                Button("OK") { }
            } message: {
                Text("RoomPlan requires a device with a LiDAR scanner. This device does not have a LiDAR sensor.")
            }
        }
    }

    private var isFormValid: Bool {
        !dormName.trimmingCharacters(in: .whitespaces).isEmpty &&
        !roomNumber.trimmingCharacters(in: .whitespaces).isEmpty
    }

    private func startScan() {
        guard RoomCaptureSession.isSupported else {
            showingUnsupportedAlert = true
            return
        }
        showingScanner = true
    }
}

#Preview {
    NewScanView()
        .modelContainer(for: DormRoom.self, inMemory: true)
}
