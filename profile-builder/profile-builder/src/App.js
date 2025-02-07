import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import axios from "axios";

const FieldTypes = {
  TEXT: "Text Field",
  NUMBER: "Number Field",
  DATE: "Date Field",
};

const Field = ({ field, index }) => {
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
        padding: "10px",
        margin: "5px",
        backgroundColor: "lightgray",
        cursor: "grab",
        opacity: isDragging ? 0.5 : 1,
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
        padding: "20px",
        minHeight: "150px",
        border: "2px dashed gray",
        backgroundColor: isOver ? "lightblue" : "white",
      }}
    >
      {fields.map((field, index) => (
        <div key={index} style={{ padding: "5px", background: "lightgreen" }}>
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
      <h2>Profile Builder</h2>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h3>Available Fields</h3>
          {Object.values(FieldTypes).map((field, index) => (
            <Field key={index} field={field} index={index} />
          ))}
        </div>
        <DropArea fields={fields} setFields={setFields} />
      </div>
      <button onClick={handleSubmit}>Save Profile</button>
    </DndProvider>
  );
};

export default App;