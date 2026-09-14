import LoginImg from "../assets/LoginImg.svg";
import CalculaLogo from "../assets/Logo.svg";
import { Eye, EyeClosed, CircleExclamationFill } from "@gravity-ui/icons";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavRoutes } from "../NavRoutes";
import {
  Form,
  Input,
  Label,
  Button,
  TextField,
  FieldError,
  InputGroup,
  Modal,
} from "@heroui/react";
import { loginUser } from "../api/auth";
import { useContext } from "react";
import { userContext } from "../context/UserContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState({
    title: "",
    message: "",
  });
  const [formData, setFormData] = useState({ username: "", password: "" });
  const { setSession } = useContext(userContext);

  useEffect(() => {
    document.title = "Login";
  }, []);

  const openErrorModal = (title, message) => {
    setErrorModalMessage({ title, message });
    setIsErrorModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await loginUser(formData);

    if (data.status === "Error") {
      openErrorModal(data.status, data.message);
      return;
    } else if (data.user?.username) {
      setSession(data);
      sessionStorage.setItem("dashboardWelcomeToast", "1");
      const normalizedRole = (data.user?.role ?? "").trim().toLowerCase();
      const targetRoute =
        normalizedRole === "supplier"
          ? NavRoutes.PRODMANAGER
          : NavRoutes.DASHBOARD;
      navigate(targetRoute);
    } else {
      openErrorModal(data.status, data.message);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-auto h-full p-auto">
      <div className="hidden w-auto lg:flex justify-center">
        <img src={LoginImg} alt="" className="w-[60%]" />
      </div>
      <div className="w-auto flex flex-col gap-5 m-auto">
        {/* Text Above Forms */}
        <img src={CalculaLogo} alt="" className="w-36 mb-12" />
        <div>
          <h1 className="text-3xl font-semibold text-zinc-800">
            Welcome Back!
          </h1>
          <p className="text-zinc-800">Login using your Calcula account.</p>
        </div>

        {/* Forms */}
        <Form
          onSubmit={handleSubmit}
          validationBehavior="native"
          className="flex flex-col gap-5 w-100 lg:w-125"
        >
          <TextField className="flex flex-col gap-1" isRequired>
            <Label htmlFor="input-type-username">Username</Label>
            <Input
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              id="input-type-username"
              placeholder="Enter username"
              type="text"
            />
            <FieldError>Please enter your username</FieldError>
          </TextField>
          <TextField fullWidth name="password" isRequired>
            <Label>Password</Label>
            <InputGroup fullWidth>
              <InputGroup.Input
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Enter password"
                type={isVisible ? "text" : "password"}
              />
              <Button
                type="button"
                aria-label={isVisible ? "Hide password" : "Show password"}
                size="sm"
                variant="light"
                isIconOnly
                onPress={() => setIsVisible(!isVisible)}
              >
                {isVisible ? <Eye size={16} /> : <EyeClosed size={16} />}
              </Button>
            </InputGroup>
            <FieldError>Please enter your password</FieldError>
          </TextField>
          <Button className="rounded-lg" fullWidth type="submit">
            Login
          </Button>
        </Form>
      </div>
      <Modal isOpen={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-90">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon className="bg-red-100 text-red-500">
                  <CircleExclamationFill className="size-5" />
                </Modal.Icon>
                <Modal.Heading>{errorModalMessage.title}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p>{errorModalMessage.message}</p>
              </Modal.Body>
              <Modal.Footer>
                <Button className="w-full" slot="close">
                  Ok
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
