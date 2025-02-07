import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import axios from "axios";

const concepts = {
  Container: [
    "equipmentTypeCode",
    "containerNumber",
    "containerSize",
    "containerType",
    "sealIndicator",
    "isEmpty",
    "isFull",
    "equipmentProperties",
    "equipmentCategoryCode",
    "equipmentContainerITUCode",
    "hasNumberOfCollies",
  ],
  Goods: [
    "goodsTypeCode",
    "typeOfCargo",
    "natureOfCargo",
    "PackageTypeNumericCode",
    "packageCode",
    "packageTypeName",
    "shippingMarks",
    "numberOfTEU",
    "numberofPackages",
    "goodsDescription",
    "goodsNumbers",
  ],
  Vessel: ["vesselName", "transportMeansMode", "vesselType", "voyageNumber", "vesselId"],
  Truck: ["hasVIN", "hasTransportmeansNationality", "transportMeansMode", "truckLicensePlate"],
  Wagon: ["wagonBrakeType", "wagonBrakeWeight", "wagonMaximumSpeed", "wagonNrAxel", "wagonId"],
};

const DraggableItem = ({ name, type }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "FIELD",
    item: { name, type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{
        padding: "10px",
        margin: "5px 0",
        backgroundColor: type === "supertype" ? "#1565C0" : "#1E88E5",
        color: "white",
        borderRadius: "8px",
        textAlign: "center",
        fontWeight: "bold",
        cursor: "grab",
        opacity: isDragging ? 0.6 : 1,
        boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.2)",
      }}
    >
      {name}
    </div>
  );
};

const DropArea = ({ fields, setFields }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "FIELD",
    drop: (item) => {
      if (item.type === "supertype") {
        // Add all properties if a supertype is dragged
        setFields((prev) => [
          ...prev,
          { name: item.name, type: "supertype" },
          ...concepts[item.name].map((prop) => ({ name: prop, type: "subtype" })),
        ]);
      } else {
        // Add a single property if a subtype is dragged
        setFields((prev) => [...prev, { name: item.name, type: "subtype" }]);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      style={{
        flex: 1,
        padding: "20px",
        minHeight: "200px",
        border: "2px dashed #BBDEFB",
        backgroundColor: isOver ? "#0D47A1" : "#1A237E",
        color: "white",
        borderRadius: "8px",
        textAlign: "center",
        boxShadow: "3px 3px 6px rgba(0, 0, 0, 0.3)",
      }}
    >
      {fields.length === 0 ? (
        <p style={{ opacity: 0.6 }}>Drag fields here...</p>
      ) : (
        <>
          <h3>Profile Fields</h3>
          {fields.map((field, index) => (
            <div
              key={index}
              style={{
                padding: "10px",
                background: field.type === "supertype" ? "#64B5F6" : "#90CAF9",
                borderRadius: "6px",
                margin: "5px 0",
                fontWeight: "bold",
              }}
            >
              {field.name}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

const App = () => {
  const [fields, setFields] = useState([]);
  const [expandedConcepts, setExpandedConcepts] = useState({});

  const toggleExpand = (concept) => {
    setExpandedConcepts((prev) => ({
      ...prev,
      [concept]: !prev[concept],
    }));
  };

  const handleSubmit = async () => {
    const jsonProfile = { fields: fields.map((f) => f.name) };
    console.log("Generated JSON:", jsonProfile);

    try {
      await axios.post("http://127.0.0.1:8000/api/profile", jsonProfile);
      alert("Profile saved!");
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        style={{
          backgroundColor: "#0D1117",
          minHeight: "100vh",
          padding: "20px",
          color: "white",
          fontFamily: "'Arial', sans-serif",
        }}
      >
        <h2 style={{ textAlign: "center", color: "#64B5F6" }}>Profile Builder</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
          <div
            style={{
              backgroundColor: "#1A237E",
              padding: "20px",
              borderRadius: "8px",
              width: "300px",
              textAlign: "center",
              boxShadow: "3px 3px 6px rgba(0, 0, 0, 0.3)",
            }}
          >
            <h3>Available Fields</h3>
            {Object.keys(concepts).map((concept) => (
              <div key={concept} style={{ marginBottom: "10px" }}>
                <div
                  style={{
                    padding: "10px",
                    backgroundColor: "#1976D2",
                    color: "white",
                    borderRadius: "8px",
                    textAlign: "center",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.2)",
                  }}
                  onClick={() => toggleExpand(concept)}
                >
                  {expandedConcepts[concept] ? "▼ " : "▶ "} {concept}
                </div>
                {expandedConcepts[concept] &&
                  concepts[concept].map((prop, idx) => (
                    <DraggableItem key={idx} name={prop} type="subtype" />
                  ))}
                <DraggableItem name={concept} type="supertype" />
              </div>
            ))}
          </div>
          <DropArea fields={fields} setFields={setFields} />
        </div>
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={handleSubmit}
            style={{
              backgroundColor: "#64B5F6",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.3)",
            }}
          >
            Save Profile
          </button>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;