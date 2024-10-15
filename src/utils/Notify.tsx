import { toast } from 'react-hot-toast';
const Notify = (messsage: string, type: string, speed = 4000) => {
    switch (type){
        case 'success':
            toast.success(`${messsage}`, {
                position: "top-center",
                duration: speed,
                // hideProgressBar: true,
                // closeOnClick: true,
                // draggable: true,
                // progress: undefined,
                });
            break;
        case 'info':
            toast(`${messsage}`, {
                position: "top-center",
                duration: speed,
                // hideProgressBar: true,
                // closeOnClick: true,
                // draggable: true,
                // progress: undefined,
                icon: 'ℹ️'
                });
            break;         
        case 'error':
            toast.error(`${messsage}`, {
                position: "top-center",
                duration: speed,
                // hideProgressBar: true,
                // closeOnClick: true,
                // draggable: true,
                // progress: undefined,
                });     
            break;
        case "":
            toast.dismiss();
            break;
        default:
            break           
    } 
    
}

export default Notify;