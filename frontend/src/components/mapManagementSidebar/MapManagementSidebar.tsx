import CrudMap from './crudMap'

function MapManagementSidebar({ campaignId, maps, setMaps, selectedMap, setSelectedMap, messages, setMessages }) {
  return (
    <section className="rounded-2xl h-full border border-[#333] bg-secondary p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
      <CrudMap
        campaignId={campaignId}
        maps={maps}
        setMaps={setMaps}
        selectedMap={selectedMap}
        setSelectedMap={setSelectedMap}
        messages={messages}
        setMessages={setMessages}
      />
    </section>
  )
}

export default MapManagementSidebar
