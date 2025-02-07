import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import axios from "axios";

const FieldTypes = {
  TEXT: "Text Field",
  NUMBER: "Number Field",
  DATE: "Date Field",
};

const Field = ({ field }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "FIELD",
    item: { field },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{
        padding: "12px",
        margin: "8px 0",
        backgroundColor: "#1E88E5",
        color: "white",
        borderRadius: "8px",
        textAlign: "center",
        fontWeight: "bold",
        cursor: "grab",
        opacity: isDragging ? 0.6 : 1,
        boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.2)",
      }}
    >
      {field}
    </div>
  );
};

const DropArea = ({ fields, setFields }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "FIELD",
    drop: (item) => setFields((prev) => [...prev, item.field]),
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
      <h3>Profile Fields</h3>
      {fields.map((field, index) => (
        <div
          key={index}
          style={{
            padding: "10px",
            background: "#64B5F6",
            borderRadius: "6px",
            margin: "5px 0",
            fontWeight: "bold",
          }}
        >
          {field}
        </div>
      ))}
    </div>
  );
};

const App = () => {
  const [fields, setFields] = useState([]);

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
              width: "200px",
              textAlign: "center",
              boxShadow: "3px 3px 6px rgba(0, 0, 0, 0.3)",
            }}
          >
            <h3>Available Fields</h3>
            {Object.values(FieldTypes).map((field, index) => (
              <Field key={index} field={field} />
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