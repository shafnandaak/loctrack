import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { User } from "@/lib/auth";
import { useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";


function SelectedUserEffect({ user }: { user: User | null }) {
  const map = useMap();
  useEffect(() => {
    if (user && user.lat && user.lng) {
      map.flyTo([user.lat, user.lng], 16);
    }
  }, [user, map]);
  return null;
}

// Ikon kustom untuk penanda di peta
const customIcon = (color: string = '#3b82f6') => new L.DivIcon({
  html: `<svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}" stroke="#fff" stroke-width="1.5"/></svg>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
});

const defaultIcon = new L.DivIcon({
  html: `<svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/></svg>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
});

// Komponen untuk secara otomatis menyesuaikan tampilan peta
function MapAutoFit({ users }: { users: User[] }) {
  const map = useMap();
  useEffect(() => {
    const activeUsers = users.filter(u => u.lat && u.lng);
    if (activeUsers.length > 0) {
      const bounds = new L.LatLngBounds(activeUsers.map(u => [u.lat!, u.lng!]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [users, map]);
  return null;
}

export function LiveMap({ users, isAdmin, selectedUserId }: { users: User[], isAdmin?: boolean, selectedUserId?: string | null }) {
  const tasikmalayaCenter: [number, number] = [-7.3273, 108.2203];
  const activeUsers = users.filter(u => u.lat && u.lng);

  const selectedUser = users.find(u => u.id === selectedUserId) || null;

  return (
    <MapContainer center={tasikmalayaCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {activeUsers.map(user => (
        <Marker 
            key={user.id} 
            position={[user.lat!, user.lng!]} 
            icon={defaultIcon}
            opacity={!selectedUserId || selectedUserId === user.id ? 1 : 0.6}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.kecamatan || "Belum diatur"}</div>
              {user.lastSeen && 
                <div className="text-xs mt-1">
                  Terakhir aktif: {format(user.lastSeen.toDate(), "HH:mm:ss", { locale: id })}
                </div>
              }
            </div>
          </Popup>
        </Marker>
      ))}

      {activeUsers.map(user => {
          // const accuracy = user.accuracy; // Asumsi field 'accuracy' ada di data user
          // if (typeof accuracy === 'number' && accuracy > 0) {
          //   return <Circle key={`${user.id}-accuracy`} center={[user.lat!, user.lng!]} radius={accuracy} pathOptions={{ color: user.color, opacity: 0.3, weight: 1, fillOpacity: 0.1 }} />
          // }
          return null;
      })}

      <MapAutoFit users={activeUsers} />
      <SelectedUserEffect user={selectedUser} />
    </MapContainer>
  );
}