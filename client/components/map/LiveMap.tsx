import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { User } from "@/lib/auth";

// Ikon default Leaflet (jika diperlukan)
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

// Anda perlu meneruskan daftar pengguna ke komponen ini
export function LiveMap({ users, isAdmin }: { users: User[], isAdmin?: boolean }) {
  // Koordinat pusat Tasikmalaya
  const center: [number, number] = [-7.3273, 108.2203];

  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {users.map(user => {
        // Hanya tampilkan marker jika user memiliki koordinat lat/lng
        if (user.lat && user.lng) {
          return (
            <Marker key={user.id} position={[user.lat, user.lng]} icon={defaultIcon}>
              <Popup>
                <b>{user.name}</b><br />
                {user.kecamatan || "Lokasi Awal"}
              </Popup>
            </Marker>
          );
        }
        return null; // Jangan render apa-apa jika tidak ada lokasi
      })}
    </MapContainer>
  );
}
