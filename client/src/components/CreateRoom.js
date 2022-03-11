import React from "react";
import { v1 as uuid } from "uuid";
import { Link } from "react-router-dom";

const CreateRoom = () => {
    const id = uuid();

    return (
        <Link to={ `/room/${id}` }>Create Room</Link>
    );
};

export default CreateRoom;