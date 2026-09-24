import CalculaLogo from "../assets/Logo_light.svg";
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
  Typography,
} from "@heroui/react";
import { loginUser } from "../api/auth";
import { useContext } from "react";
import { userContext } from "../context/UserContext";
import loginVideo from "../assets/loginvideo.mp4";

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
  const trimmedSrc = `${loginVideo}#t=7`;

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
    <div className="flex justify-center w-auto h-full lg:static relative">
      <div className="absolute top-0 left-0 lg:left-15 p-8">
        <img src={CalculaLogo} alt="Calcula logo" className="" />
      </div>
      <div className="flex-1 h-full flex flex-col gap-8 justify-center items-center">
        {/* Text Above Forms */}
        <div className="space-y-4">
          <Typography className="dark:text-zinc-100 text-zinc-800 w-full font-light text-center text-3xl lg:text-4xl lora-regular">
            Track Your Sales & Expenses
          </Typography>
          <Typography
            type="body"
            className="dark:text-zinc-100 text-zinc-800 w-full text-center lora-medium"
          >
            Sign in to manage your finances with Calcula.
          </Typography>
        </div>

        {/* Forms */}
        <Form
          onSubmit={handleSubmit}
          validationBehavior="native"
          className="bg-white flex flex-col gap-5 w-[87%] lg:w-125 p-5 rounded-4xl border border-zinc-200"
        >
          <TextField className="flex flex-col gap-1" isRequired>
            <Label htmlFor="input-type-username" className="dark:text-zinc-100">
              Username
            </Label>
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
          <TextField name="password" isRequired>
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
          <Button
            className="rounded-2xl bg-black hover:bg-zinc-900 transition-all"
            fullWidth
            type="submit"
          >
            Login
          </Button>
        </Form>
      </div>
      <div className="flex flex-1 justify-center items-center lg:static absolute z-[-1]">
        <video
          src={trimmedSrc}
          autoPlay
          loop
          muted
          className="transition-all w-screen h-screen lg:w-[70%] lg:h-[80%] lg:rounded-4xl object-cover lg:opacity-100 lg:blur-none opacity-20 blur-sm"
        />
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
