import React, { useState } from 'react';
import { Navbar, Nav, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button 
                onClick={() => setIsOpen(!isOpen)} 
                className="menu-button" 
                aria-controls="basic-navbar-nav"
            >
                ☰
            </Button>

            <Navbar bg="light" className={`flex-column sidebar ${isOpen ? 'open' : 'closed'}`}>
                <Nav defaultActiveKey="/home" className="flex-column">
                    <Nav.Link href="#table1">Table 1</Nav.Link>
                    <Nav.Link href="#table2">Table 2</Nav.Link>
                    <Nav.Link href="#table3">Table 3</Nav.Link>
                    {/* Add more links as needed */}
                </Nav>
            </Navbar>

            <div>
                {/* Your main content here */}
            </div>
        </>
    );
};

export default Sidebar;
