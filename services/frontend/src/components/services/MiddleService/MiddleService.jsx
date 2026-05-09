
import './MiddleService.css';
import { GiTeamIdea } from "react-icons/gi";
import { MdDesignServices } from "react-icons/md";
import { BsPersonWorkspace } from "react-icons/bs";
import { FcDocument } from "react-icons/fc";
import { FcSupport } from "react-icons/fc";

const MiddleService = () => {
    return (
        <div className='middle-services-container'>
            <h3>Our Delivery Process</h3>
            <h2 className='middle-title'>Super Efficient Deployment Strategy</h2>
            <div className="middle-services">
                <div className="middle-service">
                    <div className='middle-circle bg-green'>
                        <h1><GiTeamIdea /></h1>
                    </div>
                    <div className='middle-desc'>
                        <h2>Plan</h2>
                        <p>Executing Comprehensive Planning Strategy</p>
                    </div>
                </div>
                <div className="middle-service">
                    <div className='middle-circle bg-blue'>
                        <h1><MdDesignServices /></h1>
                    </div>
                    <div className='middle-desc'>
                        <h2>Design</h2>
                        <p>Crafting Creative Solutions</p>
                    </div>
                </div>
                <div className="middle-service">
                    <div className='middle-circle bg-red'>
                        <h1><BsPersonWorkspace /></h1>
                    </div>
                    <div className='middle-desc'>
                        <h2>Implement</h2>
                        <p> Bringing Plans to Life</p>
                    </div>
                </div>
                <div className="middle-service">
                    <div className='middle-circle bg-dark-green'>
                        <h1><FcDocument /></h1>
                    </div>
                    <div className='middle-desc'>
                        <h2>Document</h2>
                        <p> Recording Every Detail</p>
                    </div>
                </div>
                <div className="middle-service">
                    <div className='middle-circle bg-purple'>
                        <h1><FcSupport/></h1>
                    </div>
                    <div className='middle-desc'>
                        <h2>Support</h2>
                        <p>Ensuring Continued Success</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MiddleService;