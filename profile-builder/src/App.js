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

const DraggableItem = ({ name, type, concept }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "FIELD",
    item: { name, type, concept },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{
        padding: "8px",
        margin: "4px",
        backgroundColor: type === "supertype" ? "#1565C0" : "#1E88E5",
        color: "white",
        borderRadius: "6px",
        textAlign: "center",
        fontWeight: "bold",
        cursor: "grab",
        opacity: isDragging ? 0.6 : 1,
        fontSize: "14px",
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
      setFields((prev) => {
        const updatedFields = { ...prev };

        if (item.type === "supertype") {
          // Add all properties under the concept group
          updatedFields[item.name] = concepts[item.name].map((prop) => ({
            name: prop,
            type: "subtype",
          }));
        } else {
          // Add a single property under the correct concept
          if (!updatedFields[item.concept]) {
            updatedFields[item.concept] = [];
          }
          updatedFields[item.concept].push({ name: item.name, type: "subtype" });
        }

        return updatedFields;
      });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const removeItem = (concept, itemName) => {
    setFields((prev) => {
      const updatedFields = { ...prev };

      updatedFields[concept] = updatedFields[concept].filter((item) => item.name !== itemName);

      if (updatedFields[concept].length === 0) {
        delete updatedFields[concept]; // Remove empty concepts
      }

      return updatedFields;
    });
  };

  return (
    <div
      ref={drop}
      style={{
        flex: 1,
        padding: "15px",
        minHeight: "200px",
        border: "2px dashed #BBDEFB",
        backgroundColor: isOver ? "#0D47A1" : "#1A237E",
        color: "white",
        borderRadius: "8px",
        textAlign: "center",
        boxShadow: "3px 3px 6px rgba(0, 0, 0, 0.3)",
      }}
    >
      {Object.keys(fields).length === 0 ? (
        <p style={{ opacity: 0.6 }}>Drag fields here...</p>
      ) : (
        Object.keys(fields).map((concept) => (
          <div key={concept} style={{ marginBottom: "10px" }}>
            <h4 style={{ color: "#64B5F6", marginBottom: "5px" }}>{concept}</h4>
            {fields[concept].map((field, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px",
                  background: "#64B5F6",
                  borderRadius: "6px",
                  margin: "3px 0",
                  fontWeight: "bold",
                  fontSize: "12px",
                }}
              >
                {field.name}
                <button
                  onClick={() => removeItem(concept, field.name)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  ➖
                </button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

const App = () => {
  const [fields, setFields] = useState({});
  const [expandedConcepts, setExpandedConcepts] = useState({});

  const toggleExpand = (concept) => {
    setExpandedConcepts((prev) => ({
      ...prev,
      [concept]: !prev[concept],
    }));
  };

  const handleSubmit = async () => {
    const jsonProfile = { fields };
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
                <DraggableItem name={concept} type="supertype" concept={concept} />
                {expandedConcepts[concept] &&
                  concepts[concept].map((prop, idx) => (
                    <DraggableItem key={idx} name={prop} type="subtype" concept={concept} />
                  ))}
                <button onClick={() => toggleExpand(concept)} style={{ cursor: "pointer" }}>
                  {expandedConcepts[concept] ? "🔽 Collapse" : "▶ Expand"}
                </button>
              </div>
            ))}
          </div>
          <DropArea fields={fields} setFields={setFields} />
        </div>
      </div>
    </DndProvider>
  );
};

export default App;