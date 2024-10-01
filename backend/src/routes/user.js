import {Router} from "express";
import {login, register, addActivity, getAllActivity} from "../controllers/user.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/add_activity").post(addActivity);
router.route("/get_all_activity").get(getAllActivity);

export default router;

