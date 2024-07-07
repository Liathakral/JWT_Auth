const { signup, login, forget_password, resetpassword } = require('../Controllers/AuthController');
const { signupValidation, loginValidation } = require('../Middlewares/AuthValidation');

const router = require('express').Router();

router.post('/login', loginValidation, login);
router.post('/signup', signupValidation, signup);
router.post('/forgetpassword',forget_password);
router.post('/resetpassword',resetpassword);

module.exports = router;